import { Injectable, Logger } from '@nestjs/common';

/** Single seam for admin audit records; point `record` at the platform audit-log module when it exists. */
@Injectable()
export class OfferAuditService {
  private readonly logger = new Logger('OfferAudit');

  record(actorId: string, action: string, entityId: string, details?: Record<string, unknown>): void {
    this.logger.log(JSON.stringify({ actorId, action, entity: 'offer', entityId, at: new Date().toISOString(), ...details }));
  }
}
