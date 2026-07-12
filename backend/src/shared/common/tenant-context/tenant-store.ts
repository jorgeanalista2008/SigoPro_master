import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStorePayload {
  tenantId: string;
  companyId?: string;
  userId: string;
  isSuperAdmin: boolean;
  lang: string;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantStorePayload>();
