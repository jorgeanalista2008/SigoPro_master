import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Consorcio Contable Venezolano, C.A.', required: false, description: 'Nuevo nombre del Tenant' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'ENTERPRISE', required: false, description: 'Nuevo plan de suscripción' })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
    required: false,
    description: 'Estado de la cuenta del Tenant',
  })
  @IsEnum(['ACTIVE', 'SUSPENDED', 'INACTIVE'], {
    message: 'El estado debe ser ACTIVE, SUSPENDED o INACTIVE',
  })
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: '2028-07-03T00:00:00.000Z',
    required: false,
    description: 'Nueva fecha de vencimiento de la suscripción',
  })
  @IsDateString({}, { message: 'La fecha de vencimiento debe ser una cadena de fecha válida ISO 8601' })
  @IsOptional()
  expiresAt?: string;
}
