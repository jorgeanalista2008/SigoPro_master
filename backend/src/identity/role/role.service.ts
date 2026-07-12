import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAllRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    }));
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(tenantId: string, createDto: CreateRoleDto) {
    // 1. Verify uniqueness of role name inside the tenant
    const existing = await this.prisma.role.findFirst({
      where: {
        name: createDto.name,
        tenantId,
      },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un rol con el nombre "${createDto.name}" en esta organización.`);
    }

    // 2. Validate permission IDs exist in the catalog
    if (createDto.permissionIds && createDto.permissionIds.length > 0) {
      const count = await this.prisma.permission.count({
        where: { id: { in: createDto.permissionIds } },
      });
      if (count !== createDto.permissionIds.length) {
        throw new BadRequestException('Uno o más IDs de permisos proporcionados no son válidos.');
      }
    }

    // 3. Create role and link permissions inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: createDto.name,
          tenantId,
        },
      });

      if (createDto.permissionIds && createDto.permissionIds.length > 0) {
        const rolePermissions = createDto.permissionIds.map((pId) => ({
          roleId: role.id,
          permissionId: pId,
        }));
        await tx.rolePermission.createMany({
          data: rolePermissions,
        });
      }

      const created = await tx.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!created) {
        throw new NotFoundException('No se pudo recuperar el rol recién creado.');
      }

      return {
        id: created.id,
        name: created.name,
        createdAt: created.createdAt,
        permissions: created.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
      };
    });
  }

  async updateRole(roleId: string, tenantId: string, updateDto: UpdateRoleDto) {
    // 1. Find role and verify tenant ownership
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new NotFoundException('El rol especificado no existe o no pertenece a esta organización.');
    }

    // 2. Validate unique name inside tenant if changed
    if (updateDto.name && updateDto.name !== role.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          name: updateDto.name,
          tenantId,
        },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un rol con el nombre "${updateDto.name}" en esta organización.`);
      }
    }

    // 3. Validate permission IDs exist
    if (updateDto.permissionIds && updateDto.permissionIds.length > 0) {
      const count = await this.prisma.permission.count({
        where: { id: { in: updateDto.permissionIds } },
      });
      if (count !== updateDto.permissionIds.length) {
        throw new BadRequestException('Uno o más IDs de permisos proporcionados no son válidos.');
      }
    }

    // 4. Update inside a transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: {
          ...(updateDto.name && { name: updateDto.name }),
        },
      });

      if (updateDto.permissionIds !== undefined) {
        // Clear existing permission connections
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        // Insert new connections
        if (updateDto.permissionIds.length > 0) {
          const rolePermissions = updateDto.permissionIds.map((pId) => ({
            roleId,
            permissionId: pId,
          }));
          await tx.rolePermission.createMany({
            data: rolePermissions,
          });
        }
      }

      const updated = await tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!updated) {
        throw new NotFoundException('No se pudo recuperar el rol actualizado.');
      }

      return {
        id: updated.id,
        name: updated.name,
        createdAt: updated.createdAt,
        permissions: updated.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
      };
    });
  }

  async deleteRole(roleId: string, tenantId: string) {
    // 1. Verify existence, tenant ownership, and count active users
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    if (!role) {
      throw new NotFoundException('El rol especificado no existe o no pertenece a esta organización.');
    }

    // 2. Prevent deleting default Administrador de Firma role
    if (role.name === 'Administrador de Firma') {
      throw new BadRequestException('No se permite eliminar el rol "Administrador de Firma" por defecto.');
    }

    // 3. Prevent deleting if assigned to active users
    if (role._count.users > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol "${role.name}" porque está asignado a ${role._count.users} usuario(s) activo(s).`,
      );
    }

    // 4. Delete the role
    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return { message: `El rol "${role.name}" ha sido eliminado exitosamente.` };
  }

  async createPermission(data: { name: string; description?: string }) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un permiso con el nombre "${data.name}".`);
    }
    return this.prisma.permission.create({ data });
  }

  async updatePermission(id: string, data: { name?: string; description?: string }) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado.`);
    }
    if (data.name && data.name !== perm.name) {
      const existing = await this.prisma.permission.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un permiso con el nombre "${data.name}".`);
      }
    }
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async deletePermission(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado.`);
    }
    await this.prisma.permission.delete({ where: { id } });
    return { message: `Permiso "${perm.name}" eliminado con éxito.` };
  }
}
