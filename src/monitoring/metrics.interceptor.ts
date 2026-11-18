import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs';
import { recordApi } from './metrics';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    if (ctx.getType() !== 'http') return next.handle();
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const start = process.hrtime.bigint();
    const route = req.route?.path ?? 'unmatched';       // template, never raw URL
    const done = (status: number) =>
      recordApi(route, req.method, status, Number(process.hrtime.bigint() - start) / 1e9);
    return next.handle().pipe(tap({
      next: () => done(res.statusCode),
      error: (e) => done(e?.status ?? e?.getStatus?.() ?? 500),
    }));
  }
}