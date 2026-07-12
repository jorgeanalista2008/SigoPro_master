import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../identity/auth/guards/super-admin.guard';

@ApiTags('Super Administrador (Sistema Global)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Listar todos los Tenants (Clientes corporativos) del SaaS' })
  @ApiResponse({
    status: 200,
    description: 'Lista global de tenants obtenida con éxito.',
  })
  findAllTenants() {
    return this.superAdminService.findAllTenants();
  }

  @Get('companies')
  @ApiOperation({ summary: 'Listar todas las empresas registradas en todo el sistema' })
  @ApiResponse({
    status: 200,
    description: 'Lista global de empresas obtenida con éxito.',
  })
  findAllCompanies() {
    return this.superAdminService.findAllCompanies();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios del sistema e indicar a qué tenant y rol pertenecen' })
  @ApiResponse({
    status: 200,
    description: 'Lista global de usuarios obtenida con éxito.',
  })
  findAllUsers() {
    return this.superAdminService.findAllUsers();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener métricas y KPIs globales del sistema' })
  @ApiResponse({
    status: 200,
    description: 'Métricas del sistema obtenidas con éxito.',
  })
  getStats() {
    return this.superAdminService.getSystemStats();
  }
}
