import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'María Delgado', required: false, description: 'Nuevo nombre completo del usuario' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'maria@demo.com', required: false, description: 'Nuevo correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    required: false,
    description: 'Nuevo estado de la cuenta',
  })
  @IsEnum(['ACTIVE', 'INACTIVE'], {
    message: 'El estado debe ser ACTIVE o INACTIVE',
  })
  @IsOptional()
  status?: string;

  @ApiProperty({ example: '3a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d', required: false, description: 'Nuevo ID de rol' })
  @IsUUID('4', { message: 'El roleId debe ser un UUID v4 válido' })
  @IsOptional()
  roleId?: string;

  @ApiProperty({ example: 'NuevaClave123!', required: false, description: 'Nueva contraseña opcional' })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número o carácter especial',
  })
  password?: string;
}
