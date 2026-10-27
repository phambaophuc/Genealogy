import { ApiProperty } from '@nestjs/swagger';

export class AppInfoDto {
  @ApiProperty({ example: 'NestJS Base' })
  name!: string;

  @ApiProperty({ example: '1.0.0' })
  version!: string;

  @ApiProperty({ example: 'development' })
  environment!: string;

  @ApiProperty({
    description: 'Swagger UI path, or null when docs are disabled.',
    example: '/docs',
    nullable: true,
  })
  docs!: string | null;
}
