import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ParentChildKind,
  ParentRole,
  PersonGender,
  SpouseEndReason,
} from '../../../database/entities/genealogy.enums';

export class PersonSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  fullName!: string;

  @ApiPropertyOptional({ nullable: true })
  commonName!: string | null;

  @ApiProperty({ enum: PersonGender })
  gender!: PersonGender;

  @ApiPropertyOptional({ example: '1945-09-02', nullable: true })
  birthDate!: string | null;

  @ApiPropertyOptional({ example: '2018-01-15', nullable: true })
  deathDate!: string | null;

  @ApiProperty({ example: false })
  isDeceased!: boolean;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;
}

export class PersonParentLinkDto {
  @ApiProperty({ type: () => PersonSummaryDto })
  person!: PersonSummaryDto;

  @ApiProperty({ enum: ParentRole })
  parentRole!: ParentRole;

  @ApiProperty({ enum: ParentChildKind })
  kind!: ParentChildKind;
}

export class PersonChildLinkDto {
  @ApiProperty({ type: () => PersonSummaryDto })
  person!: PersonSummaryDto;

  @ApiProperty({ enum: ParentRole })
  parentRole!: ParentRole;

  @ApiProperty({ enum: ParentChildKind })
  kind!: ParentChildKind;
}

export class PersonSpouseLinkDto {
  @ApiProperty({ type: () => PersonSummaryDto })
  person!: PersonSummaryDto;

  @ApiPropertyOptional({ example: '1968-02-14', nullable: true })
  marriageDate!: string | null;

  @ApiPropertyOptional({ example: '1990-06-01', nullable: true })
  endDate!: string | null;

  @ApiPropertyOptional({ enum: SpouseEndReason, nullable: true })
  endReason!: SpouseEndReason | null;
}

export class PersonRelationsDto {
  @ApiProperty({ type: () => PersonSummaryDto })
  person!: PersonSummaryDto;

  @ApiProperty({ type: () => [PersonParentLinkDto] })
  parents!: PersonParentLinkDto[];

  @ApiProperty({ type: () => [PersonChildLinkDto] })
  children!: PersonChildLinkDto[];

  @ApiProperty({ type: () => [PersonSpouseLinkDto] })
  spouses!: PersonSpouseLinkDto[];
}
