import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';

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
}
