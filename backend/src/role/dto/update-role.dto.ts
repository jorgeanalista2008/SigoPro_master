import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'Auditor Senior', description: 'Nuevo nombre para el rol', required: false })
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del rol no puede estar vacío' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: ['uuid-permiso-1', 'uuid-permiso-2'],
    description: 'Lista actualizada de IDs de los permisos (reemplaza la anterior)',
    type: [String],
    required: false,
  })
  @IsArray({ message: 'Los permisos deben ser proporcionados como una lista' })
  @IsString({ each: true, message: 'Cada ID de permiso debe ser una cadena de texto' })
  @IsOptional()
  permissionIds?: string[];
}
