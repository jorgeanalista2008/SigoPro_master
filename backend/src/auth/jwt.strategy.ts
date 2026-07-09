import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL ERROR: La variable de entorno JWT_SECRET no está definida.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.tenant_id || !payload.sub) {
      throw new UnauthorizedException('Token no válido o mal estructurado');
    }
    
    // This return value will be injected as request.user
    return {
      userId: payload.sub,
      tenantId: payload.tenant_id,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      isSuperAdmin: !!payload.is_super_admin,
    };
  }
}
