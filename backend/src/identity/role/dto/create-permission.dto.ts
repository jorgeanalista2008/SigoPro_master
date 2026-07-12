import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'accounting:write', description: 'Nombre único del permiso' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Crear o editar cuentas y registrar asientos', description: 'Descripción detallada', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
