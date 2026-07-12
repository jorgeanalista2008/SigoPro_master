import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  action: string;
  entity: string;
}

export const AUDIT_METADATA_KEY = 'audit_metadata';

export const Audit = (action: string, entity: string) => 
  SetMetadata(AUDIT_METADATA_KEY, { action, entity });
