import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code';

/**
 * Application-level exception with a stable error code.
 *
 * @example
 * throw new AppException(ErrorCode.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
 */
export class AppException extends HttpException {
  constructor(
    code: ErrorCode | string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(
      {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      status,
    );
  }
}
