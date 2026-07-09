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
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Empresas Contables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('company:write')
  @ApiOperation({ summary: 'Registrar una nueva empresa contable asignada a tu Tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Empresa creada con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No posees permisos de escritura para empresas.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El RIF de la empresa ya se encuentra registrado.',
  })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.companyService.create(createCompanyDto, tenantId);
  }

  @Get()
  @RequirePermissions('company:read')
  @ApiOperation({ summary: 'Listar todas las empresas contables bajo tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de empresas obtenido con éxito.',
  })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.companyService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions('company:read')
  @ApiOperation({ summary: 'Obtener detalles de una empresa contable de tu Tenant por su ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles de la empresa obtenidos con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa no encontrada o no pertenece a tu Tenant.',
  })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.companyService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions('company:write')
  @ApiOperation({ summary: 'Modificar una empresa contable perteneciente a tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Empresa modificada con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa no encontrada o no pertenece a tu Tenant.',
  })
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.companyService.update(id, updateCompanyDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('company:write')
  @ApiOperation({ summary: 'Eliminar una empresa contable perteneciente a tu Tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Empresa eliminada con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa no encontrada o no pertenece a tu Tenant.',
  })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.companyService.remove(id, tenantId);
  }
}
