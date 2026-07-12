import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class JournalEntryLineDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la cuenta contable' })
  @IsUUID('4', { message: 'El accountId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El accountId es requerido' })
  accountId: string;

  @ApiProperty({ example: 500.0, description: 'Monto al Debe', required: false, default: 0 })
  @IsNumber({}, { message: 'El monto al debe debe ser numérico' })
  @Min(0, { message: 'El debe no puede ser negativo' })
  @IsOptional()
  debit?: number;

  @ApiProperty({ example: 0.0, description: 'Monto al Haber', required: false, default: 0 })
  @IsNumber({}, { message: 'El monto al haber debe ser numérico' })
  @Min(0, { message: 'El haber no puede ser negativo' })
  @IsOptional()
  credit?: number;

  @ApiProperty({ example: 'Glosa descriptiva de la línea', description: 'Concepto de la línea', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2026-07-04T12:00:00.000Z', description: 'Fecha del asiento contable' })
  @IsDateString({}, { message: 'La fecha del asiento no es válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiProperty({ example: 'Registro de compras del mes', description: 'Concepto general del asiento' })
  @IsString()
  @IsNotEmpty({ message: 'La descripción del asiento es requerida' })
  description: string;

  @ApiProperty({ example: 'FACT-00213', description: 'Referencia de soporte', required: false })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ type: [JournalEntryLineDto], description: 'Detalle de líneas del asiento' })
  @IsArray()
  @IsNotEmpty({ message: 'Las líneas del asiento son requeridas' })
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
