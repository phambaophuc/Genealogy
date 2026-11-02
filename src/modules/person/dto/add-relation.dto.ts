import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ParentChildKind,
  ParentRole,
  SpouseEndReason,
} from '../../../database/entities/genealogy.enums';
import { CreatePersonDto, DATE_ONLY_PATTERN } from './create-person.dto';

export class AddRelationTargetDto {
  @ApiPropertyOptional({
    description: 'Id of an existing person to link.',
    format: 'uuid',
  })
  @ValidateIf((dto: AddRelationTargetDto) => dto.person === undefined)
  @IsUUID(undefined, {
    message:
      'personId must be a UUID, or provide a person object to create a new one.',
  })
  personId?: string;

  @ApiPropertyOptional({
    description:
      'New person to create and link in the same request. Mutually ' +
      'exclusive with personId.',
    type: () => CreatePersonDto,
  })
  @ValidateIf((dto: AddRelationTargetDto) => dto.personId === undefined)
  @ValidateNested()
  @Type(() => CreatePersonDto)
  person?: CreatePersonDto;
}

export class AddSpouseDto extends AddRelationTargetDto {
  @ApiPropertyOptional({
    description: 'Marriage date in ISO format (YYYY-MM-DD).',
    example: '1968-02-14',
    pattern: DATE_ONLY_PATTERN.source,
    nullable: true,
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'marriageDate must be a date in YYYY-MM-DD format.',
  })
  marriageDate?: string | null;

  @ApiPropertyOptional({
    description: 'Date the marriage ended in ISO format (YYYY-MM-DD).',
    example: null,
    pattern: DATE_ONLY_PATTERN.source,
    nullable: true,
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'endDate must be a date in YYYY-MM-DD format.',
  })
  endDate?: string | null;

  @ApiPropertyOptional({
    description: 'Why the marriage ended. Requires endDate to be meaningful.',
    enum: SpouseEndReason,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(SpouseEndReason)
  endReason?: SpouseEndReason | null;
}

export class AddParentDto extends AddRelationTargetDto {
  @ApiPropertyOptional({
    description:
      'Role the added person plays towards :id. Defaults to FATHER or ' +
      'MOTHER based on the added person gender; send it explicitly when the ' +
      'gender is UNKNOWN or OTHER.',
    enum: ParentRole,
  })
  @IsOptional()
  @IsEnum(ParentRole)
  parentRole?: ParentRole;

  @ApiPropertyOptional({
    description: 'Kind of parent link.',
    enum: ParentChildKind,
    default: ParentChildKind.BIOLOGICAL,
  })
  @IsOptional()
  @IsEnum(ParentChildKind)
  kind?: ParentChildKind;
}

export class AddChildDto extends AddRelationTargetDto {
  @ApiPropertyOptional({
    description:
      'Role :id plays towards the added child. Defaults to FATHER or MOTHER ' +
      'based on the gender of :id; send it explicitly when that gender is ' +
      'UNKNOWN or OTHER.',
    enum: ParentRole,
  })
  @IsOptional()
  @IsEnum(ParentRole)
  parentRole?: ParentRole;

  @ApiPropertyOptional({
    description: 'Kind of parent link.',
    enum: ParentChildKind,
    default: ParentChildKind.BIOLOGICAL,
  })
  @IsOptional()
  @IsEnum(ParentChildKind)
  kind?: ParentChildKind;
}
