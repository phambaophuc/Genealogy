import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import {
  DEFAULT_ERROR_MESSAGES,
  ERROR_CODE_BY_STATUS,
  ErrorCode,
} from '../errors/error-code';
import { ApiErrorResponse } from '../interfaces/api-response.interface';
import { RequestWithContext } from '../interfaces/request-with-context.interface';
import { getRequestId } from '../utils/get-request-id';

interface ResolvedError {
  code: string;
  message: string;
  details?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Converts every exception into the API's standard error envelope.
 * Unknown errors are logged with their stack trace but never leaked to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = this.resolveError(exception, status);
    const requestId = getRequestId(request);

    if (status >= 500) {
      this.logger.error(
        {
          err: exception,
          requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: status,
          code: error.code,
        },
        'Request failed with an unhandled error',
      );
    }

    if (response.headersSent) {
      return;
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      requestId,
      path: request.originalUrl,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private resolveError(exception: unknown, status: number): ResolvedError {
    const fallbackCode =
      ERROR_CODE_BY_STATUS[status] ?? ErrorCode.INTERNAL_SERVER_ERROR;
    const fallbackMessage =
      DEFAULT_ERROR_MESSAGES[status] ?? 'An unexpected error occurred.';

    if (!(exception instanceof HttpException)) {
      return {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: DEFAULT_ERROR_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR]!,
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return { code: fallbackCode, message: exceptionResponse };
    }

    if (!isRecord(exceptionResponse)) {
      return {
        code: fallbackCode,
        message: exception.message || fallbackMessage,
      };
    }

    const hasExplicitCode = typeof exceptionResponse.code === 'string';
    const rawMessage = exceptionResponse.message;

    let message: string | undefined;
    let details = exceptionResponse.details;

    if (Array.isArray(rawMessage)) {
      // Nest's ValidationPipe (or a custom validator) returned a list of messages.
      message = 'Validation failed';
      details = details ?? rawMessage;
    } else if (typeof rawMessage === 'string') {
      message = rawMessage;
    }

    const code = hasExplicitCode
      ? (exceptionResponse.code as string)
      : Array.isArray(rawMessage)
        ? ErrorCode.VALIDATION_ERROR
        : fallbackCode;

    if (!message) {
      message = fallbackMessage;
    }

    // ThrottlerException exposes a noisy class-prefixed message; replace it.
    if (status === 429 && !hasExplicitCode) {
      message = DEFAULT_ERROR_MESSAGES[429]!;
    }

    return { code, message, details };
  }
}
