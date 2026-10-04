import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T | null>> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T | null>> {
    return next.handle().pipe(map((data) => ({ success: true as const, data: data ?? null, message: '' })));
  }
}
