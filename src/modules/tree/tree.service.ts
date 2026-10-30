import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  TreeGraphResponseDto,
  TreeParentChildDto,
  TreePersonDto,
  TreeSpouseDto,
} from './dto/tree-graph-response.dto';
import { AppException } from 'src/common/errors/app.exception';
import { Person } from 'src/database/entities/person.entity';
import { ParentChild } from 'src/database/entities/parent-child.entity';
import { Spouse } from 'src/database/entities/spouse.entity';

export const MAX_TREE_PERSONS = 10_000;

@Injectable()
export class TreeService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getGraph(): Promise<TreeGraphResponseDto> {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      await manager.query('SET TRANSACTION READ ONLY');

      const persons = await this.loadPersons(manager);
      const parentChild = await this.loadParentChild(manager);
      const spouses = await this.loadSpouses(manager);

      return {
        persons: persons.map((person) => this.toPersonDto(person)),
        parentChild: parentChild.map((link) => this.toParentChildDto(link)),
        spouses: spouses.map((link) => this.toSpouseDto(link)),
      };
    });
  }

  private async loadPersons(manager: EntityManager): Promise<Person[]> {
    const persons = await manager.getRepository(Person).find({
      select: {
        id: true,
        fullName: true,
        commonName: true,
        gender: true,
        birthDate: true,
        deathDate: true,
        isDeceased: true,
        birthOrder: true,
        avatarUrl: true,
      },
      order: { id: 'ASC' },
      take: MAX_TREE_PERSONS + 1,
    });

    if (persons.length > MAX_TREE_PERSONS) {
      throw new AppException(
        'TREE_GRAPH_LIMIT_EXCEEDED',
        `The family tree contains more than ${MAX_TREE_PERSONS} persons. The graph cannot be returned.`,
        HttpStatus.PAYLOAD_TOO_LARGE,
        { maxPersons: MAX_TREE_PERSONS },
      );
    }

    return persons;
  }

  private loadParentChild(manager: EntityManager): Promise<ParentChild[]> {
    return manager
      .getRepository(ParentChild)
      .createQueryBuilder('pc')
      .select([
        'pc.id',
        'pc.parentId',
        'pc.childId',
        'pc.parentRole',
        'pc.kind',
      ])
      .innerJoin(
        Person,
        'parent',
        'parent.id = pc.parentId AND parent.deletedAt IS NULL',
      )
      .innerJoin(
        Person,
        'child',
        'child.id = pc.childId AND child.deletedAt IS NULL',
      )
      .orderBy('pc.id', 'ASC')
      .getMany();
  }

  private loadSpouses(manager: EntityManager): Promise<Spouse[]> {
    return manager
      .getRepository(Spouse)
      .createQueryBuilder('sp')
      .select([
        'sp.id',
        'sp.personAId',
        'sp.personBId',
        'sp.marriageDate',
        'sp.endReason',
      ])
      .innerJoin(Person, 'a', 'a.id = sp.personAId AND a.deletedAt IS NULL')
      .innerJoin(Person, 'b', 'b.id = sp.personBId AND b.deletedAt IS NULL')
      .orderBy('sp.id', 'ASC')
      .getMany();
  }

  private toPersonDto(person: Person): TreePersonDto {
    return {
      id: person.id,
      fullName: person.fullName,
      commonName: person.commonName,
      gender: person.gender,
      birthYear: this.toYear(person.birthDate),
      deathYear: this.toYear(person.deathDate),
      isDeceased: person.isDeceased,
      birthOrder: person.birthOrder,
      avatarUrl: person.avatarUrl,
    };
  }

  private toParentChildDto(link: ParentChild): TreeParentChildDto {
    return {
      id: link.id,
      parentId: link.parentId,
      childId: link.childId,
      parentRole: link.parentRole,
      kind: link.kind,
    };
  }

  private toSpouseDto(link: Spouse): TreeSpouseDto {
    return {
      id: link.id,
      personAId: link.personAId,
      personBId: link.personBId,
      marriageDate: link.marriageDate,
      endReason: link.endReason,
    };
  }

  private toYear(value: string | Date | null | undefined): number | null {
    if (!value) {
      return null;
    }

    const year =
      value instanceof Date
        ? value.getUTCFullYear()
        : Number.parseInt(value.slice(0, 4), 10);

    return Number.isNaN(year) ? null : year;
  }
}
