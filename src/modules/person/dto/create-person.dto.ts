import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  DatePrecision,
  PersonGender,
} from '../../../database/entities/genealogy.enums';

/** Matches the `date` column type: calendar day, no time component. */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Matches the `chk_persons_death_lunar_date` constraint. */
export const LUNAR_DATE_PATTERN = /^(0[1-9]|[12][0-9]|30)\/(0[1-9]|1[0-2])N?$/;

/** Loose phone shape: digits with optional +, -, spaces and parentheses. */
export const PHONE_PATTERN = /^[0-9+\-() ]{5,20}$/;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePersonDto {
  @ApiProperty({
    description: 'Full name, including any middle names.',
    example: 'Nguyễn Văn An',
    maxLength: 150,
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Name normally used day to day.',
    example: 'An',
    maxLength: 100,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commonName?: string | null;

  @ApiPropertyOptional({
    description: 'Gender as recorded for this person.',
    enum: PersonGender,
    default: PersonGender.UNKNOWN,
  })
  @IsOptional()
  @IsEnum(PersonGender)
  gender?: PersonGender;

  @ApiPropertyOptional({
    description: 'URL or storage path of the profile photo.',
    example: 'https://cdn.example.com/avatars/an.jpg',
    maxLength: 2048,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Order among siblings, starting at 1.',
    example: 2,
    minimum: 1,
    nullable: true,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  birthOrder?: number | null;

  @ApiPropertyOptional({
    description: 'Birth date in ISO format (YYYY-MM-DD).',
    example: '1945-09-02',
    pattern: DATE_ONLY_PATTERN.source,
    nullable: true,
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'birthDate must be a date in YYYY-MM-DD format.',
  })
  birthDate?: string | null;

  @ApiPropertyOptional({
    description: 'How precisely birthDate is known.',
    enum: DatePrecision,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(DatePrecision)
  birthDatePrecision?: DatePrecision | null;

  @ApiPropertyOptional({
    description: 'Death date in ISO format (YYYY-MM-DD).',
    example: null,
    pattern: DATE_ONLY_PATTERN.source,
    nullable: true,
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'deathDate must be a date in YYYY-MM-DD format.',
  })
  deathDate?: string | null;

  @ApiPropertyOptional({
    description: 'How precisely deathDate is known.',
    example: null,
    enum: DatePrecision,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(DatePrecision)
  deathDatePrecision?: DatePrecision | null;

  @ApiPropertyOptional({
    description:
      'Lunar death date in DD/MM format, with an optional trailing N for a leap month (e.g. 15/07N).',
    pattern: LUNAR_DATE_PATTERN.source,
    example: null,
    maxLength: 6,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @Matches(LUNAR_DATE_PATTERN, {
    message: 'deathLunarDate must use the DD/MM or DD/MMN format.',
  })
  deathLunarDate?: string | null;

  @ApiPropertyOptional({
    description: 'Whether this person has died.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDeceased?: boolean;

  @ApiPropertyOptional({
    description: 'Ancestral home (quê quán).',
    example: 'Nam Định',
    maxLength: 255,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hometown?: string | null;

  @ApiPropertyOptional({
    description: 'Current residential address.',
    example: '12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  currentAddress?: string | null;

  @ApiPropertyOptional({
    description: 'Contact phone number.',
    example: '0901234567',
    pattern: PHONE_PATTERN.source,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message:
      'phone must contain 5-20 digits, spaces, parentheses, + or - only.',
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Occupation or main profession.',
    example: 'Giáo viên',
    maxLength: 150,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  occupation?: string | null;

  @ApiPropertyOptional({
    description: 'Short biography or life story.',
    example: null,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'Where the person is buried.',
    example: null,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  burialPlace?: string | null;

  @ApiPropertyOptional({
    description: 'Free-form internal notes.',
    example: null,
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  notes?: string | null;
}
