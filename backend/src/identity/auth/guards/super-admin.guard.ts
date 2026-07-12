import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if the user is logged in and flagged as a system Super Admin
    if (!user || user.isSuperAdmin !== true) {
      throw new ForbiddenException(
        'Acceso restringido: Este recurso solo puede ser gestionado por el Administrador del Sistema (Super Admin)',
      );
    }

    return true;
  }
}
