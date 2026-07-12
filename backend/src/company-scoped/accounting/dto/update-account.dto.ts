import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({ example: 'Caja Auxiliar Valera', required: false, description: 'Nuevo nombre de la cuenta' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Modificar si la cuenta acepta transacciones directas',
  })
  @IsBoolean()
  @IsOptional()
  isTransactional?: boolean;

  @ApiProperty({
    example: '3a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d',
    required: false,
    description: 'ID de la cuenta padre en caso de reestructuración',
  })
  @IsUUID('4', { message: 'El parentId debe ser un UUID v4 válido' })
  @IsOptional()
  parentId?: string;
}
