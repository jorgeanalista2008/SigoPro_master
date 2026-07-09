import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateCompanyDto {
  @ApiProperty({
    example: 'Comercial Belloso, C.A.',
    required: false,
    description: 'Nuevo nombre o razón social de la empresa',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'J-30065432-1',
    required: false,
    description: 'Nuevo RIF de la empresa en Venezuela (Formato: J-12345678-9)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[JGVECjgvec]-\d{8}-\d$/, {
    message: 'El RIF debe tener un formato de RIF venezolano válido (ej. J-12345678-9)',
  })
  rif?: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    required: false,
    description: 'Nuevo estado operativo de la empresa',
  })
  @IsEnum(['ACTIVE', 'INACTIVE'], {
    message: 'El estado debe ser ACTIVE o INACTIVE',
  })
  @IsOptional()
  status?: string;
}
