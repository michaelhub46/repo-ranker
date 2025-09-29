import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, query, body } = request;
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - Query: ${JSON.stringify(query)} - Body: ${JSON.stringify(body)}`
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `Request Complete: ${method} ${originalUrl} - Duration: ${duration}ms - Response Size: ${JSON.stringify(data).length} bytes`
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request Failed: ${method} ${originalUrl} - Duration: ${duration}ms - Error: ${error.message}`
          );
        },
      }),
    );
  }
}