import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export enum TaxDocumentType {
  COMPRA = 'COMPRA',
  VENTA = 'VENTA',
}

export enum FiscalDocType {
  FACTURA = 'FACTURA',
  NOTA_DEBITO = 'NOTA_DEBITO',
  NOTA_CREDITO = 'NOTA_CREDITO',
}

export class CreateTaxDocumentDto {
  @ApiProperty({ example: 'COMPRA', enum: TaxDocumentType, description: 'Tipo de operación fiscal' })
  @IsEnum(TaxDocumentType, { message: 'El tipo debe ser COMPRA o VENTA' })
  @IsNotEmpty({ message: 'El tipo es requerido' })
  type: TaxDocumentType;

  @ApiProperty({ example: 'FACTURA', enum: FiscalDocType, description: 'Tipo de documento' })
  @IsEnum(FiscalDocType, { message: 'El documento debe ser FACTURA, NOTA_DEBITO o NOTA_CREDITO' })
  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  documentType: FiscalDocType;

  @ApiProperty({ example: '00004561', description: 'Número de factura' })
  @IsString()
  @IsNotEmpty({ message: 'El número de factura es requerido' })
  invoiceNumber: string;

  @ApiProperty({ example: '00-009841', description: 'Número de control fiscal (obligatorio en Venezuela)' })
  @IsString()
  @IsNotEmpty({ message: 'El número de control es requerido' })
  controlNumber: string;

  @ApiProperty({ example: 'J-12345678-9', description: 'RIF de la contraparte' })
  @IsString()
  @IsNotEmpty({ message: 'El RIF es requerido' })
  @Matches(/^[JGVECjgvec]-\d{8}-\d$/, {
    message: 'El RIF debe tener un formato de RIF venezolano válido (ej. J-12345678-9)',
  })
  rif: string;

  @ApiProperty({ example: 'Distribuidora Alfa, C.A.', description: 'Razón social de la contraparte' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre o razón social es requerido' })
  name: string;

  @ApiProperty({ example: '2026-07-04T12:00:00.000Z', description: 'Fecha del documento' })
  @IsDateString({}, { message: 'La fecha no es válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiProperty({ example: 1000.0, description: 'Base imponible (Subtotal)' })
  @IsNumber({}, { message: 'El subtotal debe ser numérico' })
  @Min(0, { message: 'El subtotal no puede ser negativo' })
  @IsNotEmpty({ message: 'El subtotal es requerido' })
  subtotal: number;

  @ApiProperty({ example: 16.0, default: 16.0, description: 'Alícuota de IVA aplicable (e.g. 16, 8, 0)' })
  @IsNumber({}, { message: 'La tasa de IVA debe ser un número' })
  @IsOptional()
  ivaRate?: number;

  @ApiProperty({ example: 75.0, description: 'Porcentaje de retención de IVA (e.g. 75, 100)', required: false })
  @IsNumber({}, { message: 'El porcentaje de retención de IVA debe ser numérico' })
  @IsOptional()
  ivaWithholdingRate?: number;

  @ApiProperty({ example: '20260700000001', description: 'Número del comprobante de retención', required: false })
  @IsString()
  @IsOptional()
  retentionVoucherNumber?: string;

  @ApiProperty({
    example: '2026-07-04T12:00:00.000Z',
    description: 'Fecha de emisión del comprobante de retención',
    required: false,
  })
  @IsDateString({}, { message: 'La fecha de retención no es válida' })
  @IsOptional()
  retentionDate?: string;

  @ApiProperty({
    example: 2.0,
    description: 'Tasa de retención de ISLR (Decreto 1808, e.g. 1, 2, 3, 5)',
    required: false,
  })
  @IsNumber({}, { message: 'La tasa de retención de ISLR debe ser numérica' })
  @IsOptional()
  islrWithholdingRate?: number;

  @ApiProperty({ example: true, default: true, description: 'Generar automáticamente el asiento de diario' })
  @IsBoolean()
  @IsOptional()
  autoPost?: boolean;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Cuenta contable para registrar el costo/gasto (Requerido para COMPRA)',
    required: false,
  })
  @IsUUID('4', { message: 'El expenseAccountId debe ser un UUID v4 válido' })
  @IsOptional()
  expenseAccountId?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Cuenta contable para registrar el ingreso (Requerido para VENTA)',
    required: false,
  })
  @IsUUID('4', { message: 'El revenueAccountId debe ser un UUID v4 válido' })
  @IsOptional()
  revenueAccountId?: string;
}
