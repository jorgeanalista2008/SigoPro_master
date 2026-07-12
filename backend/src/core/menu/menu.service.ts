import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getFilteredMenu(
    menuName: string,
    userPermissions: string[],
  ): Promise<MenuItemResponseDto[]> {
    const menu = await this.prisma.menu.findUnique({
      where: { name: menuName },
      include: {
        items: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menú con nombre '${menuName}' no encontrado.`);
    }

    // Map database models to intermediate format with flat permissions list
    const rawItems = menu.items.map((item) => {
      const requiredPermissions = item.permissions.map(
        (p) => p.permission.name,
      );
      return {
        id: item.id,
        title: item.title,
        path: item.path,
        icon: item.icon,
        order: item.order,
        parentId: item.parentId,
        requiredPermissions,
      };
    });

    // Build hierarchy recursively starting from root items (parentId: null)
    return this.buildAndFilterTree(rawItems, null, userPermissions);
  }

  private buildAndFilterTree(
    items: any[],
    parentId: string | null,
    userPermissions: string[],
  ): MenuItemResponseDto[] {
    const result: MenuItemResponseDto[] = [];
    const levelItems = items.filter((item) => item.parentId === parentId);

    for (const item of levelItems) {
      // If the menu item specifies permissions, user must have at least one of them
      const hasPermission =
        item.requiredPermissions.length === 0 ||
        item.requiredPermissions.some((perm: string) =>
          userPermissions.includes(perm),
        );

      if (!hasPermission) {
        continue;
      }

      // Process submenus recursively
      const children = this.buildAndFilterTree(items, item.id, userPermissions);

      // Senior check: If the item has no direct path (is a folder/category container)
      // and it ends up with zero visible children, exclude it entirely to keep the UI clean
      if (item.path === null && children.length === 0) {
        continue;
      }

      result.push({
        id: item.id,
        title: item.title,
        path: item.path,
        icon: item.icon,
        order: item.order,
        children: children.sort((a, b) => a.order - b.order),
      });
    }

    return result.sort((a, b) => a.order - b.order);
  }

  // --- CRUD DE MENÚS (SISTEMA) ---

  async findAllMenus() {
    const items = await this.prisma.menuItem.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
      icon: item.icon,
      order: item.order,
      parentId: item.parentId,
      permissions: item.permissions.map((p) => ({
        id: p.permission.id,
        name: p.permission.name,
        description: p.permission.description,
      })),
    }));
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    let menu = await this.prisma.menu.findUnique({
      where: { name: 'Sidebar Principal' },
    });

    if (!menu) {
      menu = await this.prisma.menu.create({
        data: {
          name: 'Sidebar Principal',
          description: 'Menú lateral principal para el panel de control del usuario',
        },
      });
    }

    if (dto.parentId) {
      const parent = await this.prisma.menuItem.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Menú padre con ID ${dto.parentId} no encontrado.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const menuItem = await tx.menuItem.create({
        data: {
          title: dto.title,
          path: dto.path || null,
          icon: dto.icon || null,
          order: dto.order || 0,
          menuId: menu.id,
          parentId: dto.parentId || null,
        },
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        const itemPerms = dto.permissionIds.map((pId) => ({
          menuItemId: menuItem.id,
          permissionId: pId,
        }));
        await tx.menuItemPermission.createMany({
          data: itemPerms,
        });
      }

      return tx.menuItem.findUnique({
        where: { id: menuItem.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado.`);
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new NotFoundException('Un menú no puede ser su propio padre.');
      }
      const parent = await this.prisma.menuItem.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Menú padre con ID ${dto.parentId} no encontrado.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.menuItem.update({
        where: { id },
        data: {
          title: dto.title,
          path: dto.path !== undefined ? dto.path : undefined,
          icon: dto.icon !== undefined ? dto.icon : undefined,
          order: dto.order !== undefined ? dto.order : undefined,
          parentId: dto.parentId !== undefined ? dto.parentId : undefined,
        },
      });

      if (dto.permissionIds !== undefined) {
        await tx.menuItemPermission.deleteMany({
          where: { menuItemId: id },
        });

        if (dto.permissionIds.length > 0) {
          const itemPerms = dto.permissionIds.map((pId) => ({
            menuItemId: id,
            permissionId: pId,
          }));
          await tx.menuItemPermission.createMany({
            data: itemPerms,
          });
        }
      }

      return tx.menuItem.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  async deleteMenuItem(id: string) {
    const existing = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado.`);
    }

    return this.prisma.menuItem.delete({
      where: { id },
    });
  }
}
