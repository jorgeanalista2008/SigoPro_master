import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, IsDateString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Clínica Caracas, C.A.', description: 'Nombre del Tenant (Cliente Suscriptor)' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del Tenant es requerido' })
  name: string;

  @ApiProperty({
    example: 'J-40099887-1',
    description: 'RIF del Tenant en Venezuela (Formato: J-12345678-9)',
  })
  @IsString()
  @IsNotEmpty({ message: 'El RIF es requerido' })
  @Matches(/^[JGVECjgvec]-\d{8}-\d$/, {
    message: 'El RIF debe tener un formato de RIF venezolano válido (ej. J-12345678-9)',
  })
  rif: string;

  @ApiProperty({ example: 'PREMIUM', description: 'Plan de suscripción contratado', default: 'BASIC' })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({ example: '2027-07-03T00:00:00.000Z', description: 'Fecha de vencimiento de la suscripción' })
  @IsDateString({}, { message: 'La fecha de vencimiento debe ser una cadena de fecha válida ISO 8601' })
  @IsNotEmpty({ message: 'La fecha de vencimiento es requerida' })
  expiresAt: string;

  @ApiProperty({
    example: 'admin@clinicacaracas.com',
    description: 'Correo electrónico del administrador inicial del Tenant',
  })
  @IsEmail({}, { message: 'El correo electrónico del administrador no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico del administrador es requerido' })
  adminEmail: string;

  @ApiProperty({ example: 'Alejandro López', description: 'Nombre del administrador inicial del Tenant' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del administrador es requerido' })
  adminName: string;

  @ApiProperty({ example: 'ClinicaPass123!', description: 'Contraseña de la cuenta del administrador inicial' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña del administrador debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña del administrador debe contener al menos una letra mayúscula, una letra minúscula y un número o carácter especial',
  })
  adminPassword: string;
}
