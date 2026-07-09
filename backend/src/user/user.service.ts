import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, tenantId: string) {
    const { name, email, password, roleId } = createUserDto;

    // 1. Verify email uniqueness globally
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(`Ya existe un usuario registrado con el correo ${email}`);
    }

    // 2. Security Check: Verify that the assigned role belongs to the user's tenant
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) {
      throw new BadRequestException('El rol seleccionado no pertenece a tu cuenta (Tenant)');
    }

    // 3. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId,
        roleId,
        status: 'ACTIVE',
        isSuperAdmin: false,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role.name,
      createdAt: user.createdAt,
    };
  }

  async findAll(tenantId: string) {
    // Only return users of the current tenant
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isSuperAdmin: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isSuperAdmin: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado en tu cuenta.`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string) {
    // Ensure the target user exists and belongs to this tenant
    const user = await this.findOne(id, tenantId);

    const data: any = {};

    if (updateUserDto.name) data.name = updateUserDto.name;

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException(
          `Ya existe otro usuario registrado con el correo ${updateUserDto.email}`,
        );
      }
      data.email = updateUserDto.email;
    }

    if (updateUserDto.status) data.status = updateUserDto.status;

    if (updateUserDto.roleId) {
      // Security Check: Verify new role belongs to this tenant
      const role = await this.prisma.role.findFirst({
        where: { id: updateUserDto.roleId, tenantId },
      });
      if (!role) {
        throw new BadRequestException('El rol seleccionado no pertenece a tu cuenta (Tenant)');
      }
      data.roleId = updateUserDto.roleId;
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      status: updatedUser.status,
      role: updatedUser.role.name,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async remove(id: string, currentUserId: string, tenantId: string) {
    // 1. Safety check: prevent self-deletion
    if (id === currentUserId) {
      throw new BadRequestException('Seguridad: No puedes eliminar tu propia cuenta de usuario.');
    }

    // 2. Ensure target user belongs to this tenant
    await this.findOne(id, tenantId);

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: `Usuario con ID ${id} eliminado con éxito.` };
  }
}
