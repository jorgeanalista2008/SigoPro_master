import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error('FATAL ERROR: La variable de entorno JWT_SECRET no está definida.');
        }
        return process.env.JWT_SECRET;
      })(),
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRATION || '24h') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
