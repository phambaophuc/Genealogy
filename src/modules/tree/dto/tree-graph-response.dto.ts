import { ApiProperty } from '@nestjs/swagger';
import {
  ParentChildKind,
  ParentRole,
  PersonGender,
  SpouseEndReason,
} from '../../../database/entities/genealogy.enums';

export class TreePersonDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  fullName!: string;

  @ApiProperty({ type: String, nullable: true, example: 'An' })
  commonName!: string | null;

  @ApiProperty({ enum: PersonGender })
  gender!: PersonGender;

  @ApiProperty({ type: Number, nullable: true, example: 1945 })
  birthYear!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 2018 })
  deathYear!: number | null;

  @ApiProperty({ example: false })
  isDeceased!: boolean;

  @ApiProperty({ type: Number, nullable: true, example: 2 })
  birthOrder!: number | null;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;
}

export class TreeParentChildDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  parentId!: string;

  @ApiProperty({ format: 'uuid' })
  childId!: string;

  @ApiProperty({ enum: ParentRole })
  parentRole!: ParentRole;

  @ApiProperty({ enum: ParentChildKind })
  kind!: ParentChildKind;
}

export class TreeSpouseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  personAId!: string;

  @ApiProperty({ format: 'uuid' })
  personBId!: string;

  @ApiProperty({ type: String, nullable: true, example: '1968-02-14' })
  marriageDate!: string | null;

  @ApiProperty({ enum: SpouseEndReason, nullable: true })
  endReason!: SpouseEndReason | null;
}

export class TreeGraphResponseDto {
  @ApiProperty({ type: [TreePersonDto] })
  persons!: TreePersonDto[];

  @ApiProperty({ type: [TreeParentChildDto] })
  parentChild!: TreeParentChildDto[];

  @ApiProperty({ type: [TreeSpouseDto] })
  spouses!: TreeSpouseDto[];
}
