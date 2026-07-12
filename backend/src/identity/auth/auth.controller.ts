import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuditLogInterceptor } from '../../shared/common/interceptors/audit-log.interceptor';
import { Audit } from '../../shared/common/decorators/audit.decorator';

@ApiTags('Autenticación')
@Controller('auth')
@UseInterceptors(AuditLogInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Audit('LOGIN_SUCCESS', 'Auth')
  @ApiOperation({ summary: 'Iniciar sesión en la plataforma SaaS' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autenticación exitosa. Retorna el token de acceso JWT y el perfil de usuario.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas o cuenta de usuario inactiva.',
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil de usuario obtenido con éxito.',
  })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }
}
