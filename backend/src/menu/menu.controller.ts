import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';

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
    // We request the 'Sidebar Principal' seeded menu, filtering it by user's flat permissions
    return this.menuService.getFilteredMenu('Sidebar Principal', user.permissions);
  }
}
