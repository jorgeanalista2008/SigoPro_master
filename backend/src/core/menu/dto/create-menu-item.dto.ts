import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ description: 'Título de la opción de menú' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Ruta de NextJS (opcional)', required: false })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({ description: 'Código del icono (opcional)', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Orden de despliegue', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'ID del menú padre para submenús', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ description: 'IDs de permisos requeridos para ver este menú', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
