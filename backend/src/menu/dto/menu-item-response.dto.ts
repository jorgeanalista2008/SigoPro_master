import { ApiProperty } from '@nestjs/swagger';

export class MenuItemResponseDto {
  @ApiProperty({ example: '3a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d', description: 'ID único del item de menú' })
  id: string;

  @ApiProperty({ example: 'Retenciones SENIAT', description: 'Título a mostrar en la interfaz' })
  title: string;

  @ApiProperty({ example: '/retenciones/iva', required: false, nullable: true, description: 'Ruta de Next.js' })
  path?: string | null;

  @ApiProperty({ example: 'percent', required: false, nullable: true, description: 'Identificador del ícono' })
  icon?: string | null;

  @ApiProperty({ example: 4, description: 'Orden de visualización' })
  order: number;

  @ApiProperty({
    type: () => [MenuItemResponseDto],
    description: 'Submenús o elementos hijos de este nodo',
  })
  children: MenuItemResponseDto[];
}
