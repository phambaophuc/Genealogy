import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({
    description:
      'Endpoint-specific payload. See the response schema of each endpoint.',
    type: Object,
  })
  data!: unknown;

  @ApiProperty({
    description: 'Request id echoed from the x-request-id response header.',
    example: '5c9b1f2e-7f8f-4f1e-9f9a-7c2b1d3e4f5a',
  })
  requestId!: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp!: string;
}
