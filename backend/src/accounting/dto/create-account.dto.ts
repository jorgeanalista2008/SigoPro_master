import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export enum AccountType {
  ACTIVO = 'ACTIVO',
  PASIVO = 'PASIVO',
  PATRIMONIO = 'PATRIMONIO',
  INGRESO = 'INGRESO',
  COSTO = 'COSTO',
  GASTO = 'GASTO',
  CUENTAS_DE_ORDEN = 'CUENTAS_DE_ORDEN',
}

export class CreateAccountDto {
  @ApiProperty({ example: '1.1.01.01.001', description: 'Código de la cuenta contable (único por empresa)' })
  @IsString()
  @IsNotEmpty({ message: 'El código de la cuenta es requerido' })
  @Matches(/^[1-7](\.[0-9]+)*$/, {
    message: 'El código debe seguir una estructura jerárquica numérica válida separada por puntos (ej. 1.1.01.01.001)',
  })
  code: string;

  @ApiProperty({ example: 'Caja Principal', description: 'Nombre descriptivo de la cuenta' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la cuenta es requerido' })
  name: string;

  @ApiProperty({ example: 'ACTIVO', enum: AccountType, description: 'Tipo o clasificación de la cuenta contable' })
  @IsEnum(AccountType, {
    message: 'El tipo debe ser: ACTIVO, PASIVO, PATRIMONIO, INGRESO, COSTO, GASTO o CUENTAS_DE_ORDEN',
  })
  @IsNotEmpty({ message: 'El tipo de cuenta es requerido' })
  type: AccountType;

  @ApiProperty({
    example: true,
    default: true,
    description: 'Indica si la cuenta es transaccional (acepta asientos contables). Si es de grupo, debe ser false',
  })
  @IsBoolean()
  @IsOptional()
  isTransactional?: boolean;

  @ApiProperty({
    example: '3a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d',
    required: false,
    description: 'ID de la cuenta padre (padre jerárquico)',
  })
  @IsUUID('4', { message: 'El parentId debe ser un UUID v4 válido' })
  @IsOptional()
  parentId?: string;
}
