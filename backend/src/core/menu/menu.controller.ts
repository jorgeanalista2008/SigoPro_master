import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../identity/auth/guards/super-admin.guard';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@ApiTags('Menú Dinámico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener el menú dinámico adaptado a los permisos del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Árbol JSON estructurado del menú filtrado por permisos.',
    type: [MenuItemResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token inválido o ausente.',
  })
  getMenu(@CurrentUser() user: any): Promise<MenuItemResponseDto[]> {
    // If user is Super Admin, they have all permissions and bypass filters
    const userPerms = user.isSuperAdmin ? Object.keys(user.permissions || {}) : user.permissions || [];
    return this.menuService.getFilteredMenu('Sidebar Principal', user.isSuperAdmin ? ['*'] : userPerms);
  }

  @Get('all')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Obtener el listado plano de todos los ítems de menú con sus permisos requeridos (Solo Super Admin)' })
  findAll() {
    return this.menuService.findAllMenus();
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear un nuevo ítem de menú (Solo Super Admin)' })
  create(@Body() createDto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(createDto);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar las propiedades de un ítem de menú (Solo Super Admin)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateMenuItemDto) {
    return this.menuService.updateMenuItem(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar un ítem de menú (borrado en cascada de submenús y mapeos) (Solo Super Admin)' })
  remove(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }
}
