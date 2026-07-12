import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { tenantLocalStorage } from '../tenant-context/tenant-store';
import { AUDIT_METADATA_KEY, AuditOptions } from '../decorators/audit.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_METADATA_KEY, 
      context.getHandler()
    );

    if (!auditOptions) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const store = tenantLocalStorage.getStore();
          
          let tenantId = store?.tenantId;
          let userId = store?.userId;
          const companyId = store?.companyId || null;

          // Si es login, extraer tenantId y userId desde el token devuelto en la respuesta
          if (!tenantId && data && data.accessToken) {
            try {
              const parts = data.accessToken.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(
                  Buffer.from(parts[1], 'base64').toString('utf-8'),
                );
                tenantId = payload.tenant_id;
                userId = payload.sub;
              }
            } catch (e) {
              // Ignorar errores de parseo
            }
          }

          // Si aún no tenemos tenantId o userId, no se puede escribir la auditoría
          if (!tenantId || !userId) return;

          const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
          const userAgent = req.headers['user-agent'] || 'Desconocido';

          const metadata = {
            requestBody: req.body ? maskSensitiveData(req.body) : {},
            requestParams: req.params || {},
            requestQuery: req.query || {},
            responseId: data?.id || null,
          };

          // Inserción asíncrona sin bloquear la respuesta
          this.prisma.auditLog.create({
            data: {
              tenantId,
              companyId,
              userId,
              action: auditOptions.action,
              entity: auditOptions.entity,
              metadata,
              ipAddress: String(ipAddress),
              userAgent,
            }
          }).catch((err: any) => {
            console.error('❌ Error al escribir log de auditoría:', err.message);
          });
        }
      })
    );
  }
}

function maskSensitiveData(body: any): any {
  if (!body) return body;
  const masked = { ...body };
  const sensitiveKeys = ['password', 'token', 'secret', 'passwordConfirm', 'newPassword'];
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.includes(key)) {
      masked[key] = '********';
    }
  }
  return masked;
}
