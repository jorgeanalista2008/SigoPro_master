import { ApiProperty } from '@nestjs/swagger';

class UserProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Jorge Analista' })
  name: string;

  @ApiProperty({ example: 'admin@demo.com' })
  email: string;

  @ApiProperty({ example: 'Administrador' })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Access Token con el tenant_id, user_id y lista de permisos planos',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
