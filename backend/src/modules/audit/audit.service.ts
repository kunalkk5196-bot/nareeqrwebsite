import { db } from '../../data/store.js';
import { logger } from '../../utils/logger.js';

export interface RecordAuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export class AuditService {
  static record(params: RecordAuditParams) {
    const entry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      oldValues: params.oldValues ? JSON.stringify(params.oldValues) : undefined,
      newValues: params.newValues ? JSON.stringify(params.newValues) : undefined,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      createdAt: new Date().toISOString(),
    };

    db.auditLogs.unshift(entry);
    logger.info({ action: params.action, entity: params.entity, entityId: params.entityId }, 'Audit log recorded');
    return entry;
  }
}
