import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Roles y Permisos (Tenant & Sistema)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Obtener el listado de roles con sus permisos dentro de tu Tenant' })
  @ApiResponse({
    status: 200,
    description: 'Listado de roles del tenant obtenido con éxito.',
  })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.roleService.findAllRoles(tenantId);
  }

  @Get('permissions')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Obtener la lista maestra de todos los permisos disponibles en el sistema' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos del sistema obtenida con éxito.',
  })
  findAllPermissions() {
    return this.roleService.findAllPermissions();
  }

  @Post('permissions')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear un nuevo permiso global (Solo Super Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Permiso creado con éxito.',
  })
  createPermission(@Body() createDto: CreatePermissionDto) {
    return this.roleService.createPermission(createDto);
  }

  @Patch('permissions/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar un permiso global (Solo Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Permiso actualizado con éxito.',
  })
  updatePermission(@Param('id') id: string, @Body() updateDto: UpdatePermissionDto) {
    return this.roleService.updatePermission(id, updateDto);
  }

  @Delete('permissions/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar un permiso global (Solo Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Permiso eliminado con éxito.',
  })
  deletePermission(@Param('id') id: string) {
    return this.roleService.deletePermission(id);
  }

  @Post()
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Crear un nuevo rol personalizado dentro de tu Tenant' })
  @ApiResponse({
    status: 201,
    description: 'Rol creado y permisos vinculados con éxito.',
  })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() createDto: CreateRoleDto,
  ) {
    return this.roleService.createRole(tenantId, createDto);
  }

  @Patch(':id')
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Actualizar el nombre o la lista de permisos de un rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado con éxito.',
  })
  update(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() updateDto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(id, tenantId, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('role:write')
  @ApiOperation({ summary: 'Eliminar un rol personalizado (no asignado a usuarios activos)' })
  @ApiResponse({
    status: 200,
    description: 'Rol eliminado con éxito.',
  })
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.roleService.deleteRole(id, tenantId);
  }
}
