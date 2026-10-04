import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';

export type MovieAuditAction =
  | 'movie.created'
  | 'movie.updated'
  | 'movie.status_changed'
  | 'movie.credits_replaced'
  | 'movie.languages_replaced'
  | 'movie.asset_uploaded'
  | 'movie.featured_changed'
  | 'movie.schedule_changed'
  | 'movie.schedule_failed';

export interface MovieAuditEntry {
  readonly actorId: string | null;
  readonly action: MovieAuditAction;
  readonly movieId: string;
  readonly metadata?: Record<string, unknown>;
}

// Single seam to the platform audit log so the movies module has one place to adapt.
@Injectable()
export class MovieAuditService {
  constructor(private readonly auditLog: AuditLogService) {}

  async record(entry: MovieAuditEntry): Promise<void> {
    await this.auditLog.record({
      actorId: entry.actorId,
      action: entry.action,
      entityType: 'movie',
      entityId: entry.movieId,
      metadata: entry.metadata,
    });
  }
}
