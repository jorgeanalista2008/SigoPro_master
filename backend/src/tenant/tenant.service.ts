import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const { name, rif, plan, expiresAt, adminEmail, adminName, adminPassword } = createTenantDto;

    // Check if Tenant with this RIF already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { rif },
    });
    if (existingTenant) {
      throw new ConflictException(`Ya existe un suscriptor registrado con el RIF ${rif}`);
    }

    // Check if Admin email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      throw new ConflictException(
        `Ya existe un usuario registrado con el correo electrónico ${adminEmail}`,
      );
    }

    // Execute atomic onboarding transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          rif,
          plan: plan || 'BASIC',
          status: 'ACTIVE',
          expiresAt: new Date(expiresAt),
        },
      });

      // Fetch all system permissions to link them to the new roles
      const allPermissions = await tx.permission.findMany();
      const permissionsMap = new Map(allPermissions.map((p) => [p.name, p.id]));

      // 2. Create Roles for the new Tenant
      // Administrador Role
      const adminRole = await tx.role.create({
        data: {
          name: 'Administrador',
          tenantId: tenant.id,
          permissions: {
            create: allPermissions.map((p) => ({
              permissionId: p.id,
            })),
          },
        },
      });

      // Contador Role
      const contadorPermNames = [
        'company:read',
        'invoice:read',
        'invoice:write',
        'retention:read',
        'retention:create',
        'txt:generate',
      ];
      const contadorRole = await tx.role.create({
        data: {
          name: 'Contador',
          tenantId: tenant.id,
          permissions: {
            create: contadorPermNames
              .filter((name) => permissionsMap.has(name))
              .map((name) => ({
                permissionId: permissionsMap.get(name)!,
              })),
          },
        },
      });

      // Auxiliar Contable Role
      const auxiliarPermNames = ['company:read', 'invoice:read', 'retention:read'];
      const auxiliarRole = await tx.role.create({
        data: {
          name: 'Auxiliar Contable',
          tenantId: tenant.id,
          permissions: {
            create: auxiliarPermNames
              .filter((name) => permissionsMap.has(name))
              .map((name) => ({
                permissionId: permissionsMap.get(name)!,
              })),
          },
        },
      });

      // 3. Hash Administrator Password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // 4. Create Initial User
      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          tenantId: tenant.id,
          roleId: adminRole.id,
          status: 'ACTIVE',
          isSuperAdmin: false,
        },
      });

      return {
        tenant,
        adminUser: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminRole.name,
        },
      };
    });
  }

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            companies: true,
            usageLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      rif: t.rif,
      plan: t.plan,
      status: t.status,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
      userCount: t._count.users,
      companyCount: t._count.companies,
      documentsProcessed: t._count.usageLogs,
    }));
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            role: { select: { name: true } },
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            rif: true,
            status: true,
          },
        },
        _count: {
          select: {
            usageLogs: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${id} no encontrado.`);
    }

    return {
      ...tenant,
      documentsProcessed: tenant._count.usageLogs,
    };
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${id} no encontrado.`);
    }

    const data: any = { ...updateTenantDto };
    if (updateTenantDto.expiresAt) {
      data.expiresAt = new Date(updateTenantDto.expiresAt);
    }

    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${id} no encontrado.`);
    }

    // Cascade deletes are supported by @relation(onDelete: Cascade) in schema.prisma
    await this.prisma.tenant.delete({
      where: { id },
    });

    return {
      message: `Tenant con ID ${id} y todas sus entidades asociadas han sido eliminados de forma permanente.`,
    };
  }
}
