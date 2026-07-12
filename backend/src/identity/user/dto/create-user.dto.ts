import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'María Delgado', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({ example: 'maria@demo.com', description: 'Correo electrónico (único en el sistema)' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: 'MariaPass123!', description: 'Contraseña de la cuenta' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número o carácter especial',
  })
  password: string;

  @ApiProperty({ example: '3a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d', description: 'ID del rol asignado' })
  @IsUUID('4', { message: 'El roleId debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El roleId es requerido' })
  roleId: string;
}
