import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '../decorators/skip-response-transform.decorator';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';
import { RequestWithContext } from '../interfaces/request-with-context.interface';
import { getRequestId } from '../utils/get-request-id';

/**
 * Wraps successful controller responses in the standard envelope:
 *
 * { success: true, data, requestId, timestamp }
 *
 * Use @SkipResponseTransform() for streams and other non-JSON responses.
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skip) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (response.statusCode === 204) {
          return data;
        }

        return {
          success: true as const,
          data: (data ?? null) as T,
          requestId: getRequestId(request),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
