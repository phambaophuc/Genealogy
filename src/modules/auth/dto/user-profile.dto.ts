import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class UserProfileDto {
  @ApiProperty({ example: 'demo-user' })
  id!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ example: 'Demo User', required: false })
  name?: string;

  @ApiProperty({ enum: Role, isArray: true, example: [Role.ADMIN] })
  roles!: Role[];
}
