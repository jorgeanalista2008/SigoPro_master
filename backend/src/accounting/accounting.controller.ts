import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Plan de Cuentas Contables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies/:companyId/accounts')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Registrar una nueva cuenta contable' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cuenta contable creada con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'La empresa no existe o no pertenece a tu cuenta.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El código de la cuenta ya se encuentra registrado en esta empresa.',
  })
  create(
    @Param('companyId') companyId: string,
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.accountingService.create(companyId, createAccountDto, tenantId);
  }

  @Post('import-default')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Importar un plan de cuentas estándar venezolano (VEN-NIF) por defecto' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan de cuentas por defecto importado con éxito.',
  })
  importDefault(
    @Param('companyId') companyId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.accountingService.importTemplate(companyId, tenantId);
  }

  @Get()
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Listar las cuentas contables de la empresa' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['list', 'tree'],
    description: 'Formato de respuesta: list (lista plana ordenada) o tree (árbol jerárquico anidado)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cuentas contables devueltas con éxito.',
  })
  findAll(
    @Param('companyId') companyId: string,
    @Query('format') format: 'list' | 'tree' = 'list',
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.accountingService.findAll(companyId, tenantId, format);
  }

  @Get(':id')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Obtener detalles de una cuenta contable específica' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles de la cuenta contable obtenidos con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cuenta contable no encontrada.',
  })
  findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.accountingService.findOne(id, companyId, tenantId);
  }

  @Patch(':id')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Modificar datos o configuraciones de una cuenta contable' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cuenta contable modificada con éxito.',
  })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.accountingService.update(id, companyId, updateAccountDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Eliminar una cuenta contable (solo si no posee sub-cuentas)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cuenta contable eliminada con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La cuenta posee sub-cuentas y no puede ser eliminada.',
  })
  remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.accountingService.remove(id, companyId, tenantId);
  }
}
