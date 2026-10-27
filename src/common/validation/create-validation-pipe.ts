import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ErrorCode } from '../errors/error-code';
import { flattenValidationErrors } from './flatten-validation-errors';

/**
 * Global input validation policy:
 * - strip unknown properties (whitelist)
 * - reject requests that send unknown properties (forbidNonWhitelisted)
 * - transform payloads into DTO instances (@Type, @Transform)
 * - return a consistent VALIDATION_ERROR payload with field-level details
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
    validationError: {
      target: false,
      value: false,
    },
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed.',
        details: flattenValidationErrors(errors),
      }),
  });
}
