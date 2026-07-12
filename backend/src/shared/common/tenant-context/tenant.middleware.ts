import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantLocalStorage, TenantStorePayload } from './tenant-store';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const langHeader = (req.headers['accept-language'] || req.headers['x-lang'] || 'es') as string;
    const lang = langHeader.toLowerCase().includes('en') ? 'en' : 'es';

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const defaultStore: TenantStorePayload = {
        tenantId: '',
        userId: '',
        isSuperAdmin: false,
        lang,
      };
      return tenantLocalStorage.run(defaultStore, () => next());
    }

    const token = authHeader.split(' ')[1];
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8'),
        );
        
        if (payload) {
          const companyId = req.headers['x-company-id'] as string;
          
          const store: TenantStorePayload = {
            tenantId: payload.tenant_id,
            companyId: companyId || payload.company_id || undefined,
            userId: payload.sub,
            isSuperAdmin: !!payload.is_super_admin,
            lang,
          };

          return tenantLocalStorage.run(store, () => {
            next();
          });
        }
      }
    } catch (err) {
      // Ignorar errores de parseo y continuar con la burbuja básica de i18n
    }

    const fallbackStore: TenantStorePayload = {
      tenantId: '',
      userId: '',
      isSuperAdmin: false,
      lang,
    };
    tenantLocalStorage.run(fallbackStore, () => next());
  }
}
