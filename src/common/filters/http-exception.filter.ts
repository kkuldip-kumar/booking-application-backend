import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception instanceof Error ? exception.message : 'Unknown error');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false, statusCode: 500, message: 'Internal server error', error: 'Internal Server Error',
      });
      return;
    }
    const status = exception.getStatus();
    const body = exception.getResponse();
    const message = typeof body === 'string' ? body : (body as { message?: string | string[] }).message ?? exception.message;
    res.status(status).json({ success: false, statusCode: status, message, error: exception.name.replace('Exception', '') });
  }
}
