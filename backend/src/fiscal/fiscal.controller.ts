import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaxDocumentService } from './tax-document.service';
import { CreateTaxDocumentDto } from './dto/create-tax-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Control Fiscal y Declaraciones (Venezuela)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies/:companyId')
export class FiscalController {
  constructor(private readonly taxDocumentService: TaxDocumentService) {}

  @Post('tax-documents')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Registrar una factura fiscal de Compra o Venta (Autogestiona retenciones y asientos)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Documento fiscal registrado y asiento de diario publicado con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Falta información requerida de cuentas contables o formato incorrecto.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El número de factura ya se encuentra registrado para esta empresa.',
  })
  create(
    @Param('companyId') companyId: string,
    @Body() createDto: CreateTaxDocumentDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.taxDocumentService.create(companyId, createDto, tenantId);
  }

  @Get('fiscal-books/compras')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Consultar el Libro de Compras de la empresa para un mes y año específico' })
  @ApiQuery({ name: 'year', type: Number, required: true, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, required: true, example: 7 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Libro de Compras devuelto con éxito.',
  })
  getLibroCompras(
    @Param('companyId') companyId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.taxDocumentService.getLibroCompras(companyId, year, month, tenantId);
  }

  @Get('fiscal-books/ventas')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Consultar el Libro de Ventas de la empresa para un mes y año específico' })
  @ApiQuery({ name: 'year', type: Number, required: true, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, required: true, example: 7 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Libro de Ventas devuelto con éxito.',
  })
  getLibroVentas(
    @Param('companyId') companyId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.taxDocumentService.getLibroVentas(companyId, year, month, tenantId);
  }
}
