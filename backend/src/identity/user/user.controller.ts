import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gestión de Usuarios (Tenant)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Registrar un nuevo usuario (Contador, Auxiliar) en tu Tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuario creado con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o rol ajeno al tenant.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El correo electrónico ya se encuentra registrado.',
  })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.userService.create(createUserDto, tenantId);
  }

  @Get()
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Listar todos los usuarios pertenecientes a tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de usuarios obtenido con éxito.',
  })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.userService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Obtener detalles de un usuario específico de tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles del usuario obtenidos con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado o pertenece a otro Tenant.',
  })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.userService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Modificar datos, estado o rol de un usuario de tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario modificado con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o rol ajeno al tenant.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado o pertenece a otro Tenant.',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.userService.update(id, updateUserDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Dar de baja/Eliminar permanentemente a un usuario de tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario eliminado con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Intento de auto-eliminación bloqueado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado o pertenece a otro Tenant.',
  })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.userService.remove(id, currentUserId, tenantId);
  }
}
