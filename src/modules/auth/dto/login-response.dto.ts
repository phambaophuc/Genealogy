import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './user-profile.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token. Send it as: Authorization: Bearer <token>',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({
    description: 'Configured token lifetime (JWT_EXPIRES_IN).',
    example: '1h',
  })
  expiresIn!: string;

  @ApiProperty({ type: () => UserProfileDto })
  user!: UserProfileDto;
}
