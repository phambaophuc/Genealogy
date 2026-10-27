import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorBodyDto {
  @ApiProperty({
    description: 'Stable, machine-readable error code.',
    example: 'VALIDATION_ERROR',
  })
  code!: string;

  @ApiProperty({
    description: 'Human-readable error message.',
    example: 'Validation failed.',
  })
  message!: string;

  @ApiPropertyOptional({
    description:
      'Optional structured details, e.g. field-level validation errors.',
    type: Object,
    example: [{ field: 'email', messages: ['email must be an email'] }],
  })
  details?: unknown;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: () => ApiErrorBodyDto })
  error!: ApiErrorBodyDto;

  @ApiProperty({
    example: '5c9b1f2e-7f8f-4f1e-9f9a-7c2b1d3e4f5a',
    nullable: true,
  })
  requestId!: string | null;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path!: string;

  @ApiProperty({ example: 'POST' })
  method!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp!: string;
}
