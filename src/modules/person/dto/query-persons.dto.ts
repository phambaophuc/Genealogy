import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';
import { PersonGender } from '../../../database/entities/genealogy.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const PERSON_SORT_FIELDS = [
  'fullName',
  'birthDate',
  'createdAt',
  'updatedAt',
] as const;

export type PersonSortField = (typeof PERSON_SORT_FIELDS)[number];

/**
 * Query strings arrive as text, so "false" must not be turned into `true` by
 * `Boolean(value)`. Unknown shapes are passed through for @IsBoolean to reject.
 */
const toOptionalBoolean = ({ value }: TransformFnParams): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  return value;
};

export class QueryPersonsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by gender.',
    enum: PersonGender,
  })
  @IsOptional()
  @IsEnum(PersonGender)
  gender?: PersonGender;

  @ApiPropertyOptional({
    description: 'Filter by deceased status.',
  })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isDeceased?: boolean;

  @ApiPropertyOptional({
    description:
      'Field to sort by. `search` matches fullName and commonName, accent-insensitively.',
    enum: PERSON_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(PERSON_SORT_FIELDS)
  sortBy: PersonSortField = 'createdAt';

  @ApiPropertyOptional({
    description:
      'Include soft-deleted persons. Only administrators may use this flag.',
    default: false,
  })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}
