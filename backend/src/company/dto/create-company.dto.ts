import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Comercial Belloso, C.A.', description: 'Nombre o razón social de la empresa' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  name: string;

  @ApiProperty({
    example: 'J-30065432-1',
    description: 'RIF de la empresa en Venezuela (Formato: J-12345678-9)',
  })
  @IsString()
  @IsNotEmpty({ message: 'El RIF de la empresa es requerido' })
  @Matches(/^[JGVECjgvec]-\d{8}-\d$/, {
    message: 'El RIF debe tener un formato de RIF venezolano válido (ej. J-12345678-9)',
  })
  rif: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    required: false,
    description: 'Estado operativo de la empresa',
  })
  @IsString()
  @IsOptional()
  status?: string;
}
