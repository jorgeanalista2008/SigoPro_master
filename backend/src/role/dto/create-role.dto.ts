import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Auditor Externo', description: 'Nombre único del rol dentro del tenant' })
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del rol es requerido' })
  name: string;

  @ApiProperty({
    example: ['uuid-permiso-1', 'uuid-permiso-2'],
    description: 'Lista de IDs de los permisos asignados a este rol',
    type: [String],
    required: false,
  })
  @IsArray({ message: 'Los permisos deben ser proporcionados como una lista' })
  @IsString({ each: true, message: 'Cada ID de permiso debe ser una cadena de texto' })
  @IsOptional()
  permissionIds?: string[] = [];
}
