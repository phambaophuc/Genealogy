import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DatePrecision,
  PersonGender,
} from '../../../database/entities/genealogy.enums';

export class PersonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  fullName!: string;

  @ApiPropertyOptional({ example: 'An', nullable: true })
  commonName!: string | null;

  @ApiProperty({ enum: PersonGender })
  gender!: PersonGender;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  birthOrder!: number | null;

  @ApiPropertyOptional({ example: '1945-09-02', nullable: true })
  birthDate!: string | null;

  @ApiPropertyOptional({ enum: DatePrecision, nullable: true })
  birthDatePrecision!: DatePrecision | null;

  @ApiPropertyOptional({ example: '2018-01-15', nullable: true })
  deathDate!: string | null;

  @ApiPropertyOptional({ enum: DatePrecision, nullable: true })
  deathDatePrecision!: DatePrecision | null;

  @ApiPropertyOptional({ example: '15/07', nullable: true })
  deathLunarDate!: string | null;

  @ApiProperty({ example: false })
  isDeceased!: boolean;

  @ApiPropertyOptional({ nullable: true })
  hometown!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentAddress!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  occupation!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiPropertyOptional({ nullable: true })
  burialPlace!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Set only for soft-deleted rows.',
    format: 'date-time',
    nullable: true,
  })
  deletedAt!: Date | null;
}
