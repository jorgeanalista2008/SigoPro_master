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
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('Administración de Tenants (Super Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo Tenant junto con su usuario Administrador y roles por defecto',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant y Administrador creados con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El RIF del Tenant o el correo electrónico del administrador ya existen.',
  })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener un listado resumido de todos los Tenants en el sistema' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de tenants obtenido con éxito.',
  })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles y estadísticas de un Tenant específico' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles del tenant obtenidos con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant no encontrado.',
  })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modificar configuración, plan o estado de un Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant modificado con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant no encontrado.',
  })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar de forma permanente un Tenant y todas sus entidades' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant y entidades asociadas eliminados con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant no encontrado.',
  })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
