import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ParentChildKind,
  ParentRole,
  PersonGender,
} from '../../database/entities/genealogy.enums';
import type { DatePrecision } from '../../database/entities/genealogy.enums';
import { ParentChild } from '../../database/entities/parent-child.entity';
import { Person } from '../../database/entities/person.entity';
import { Spouse } from '../../database/entities/spouse.entity';
import {
  AddChildDto,
  AddParentDto,
  AddRelationTargetDto,
  AddSpouseDto,
} from './dto/add-relation.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonRelationsDto } from './dto/person-relations.dto';
import type { PersonResponseDto } from './dto/person-response.dto';
import type { PersonSortField } from './dto/query-persons.dto';
import { QueryPersonsDto } from './dto/query-persons.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { toPersonResponse, toPersonSummary } from './person.mapper';

const SORT_COLUMNS: Record<PersonSortField, string> = {
  fullName: 'person.fullName',
  birthDate: 'person.birthDate',
  createdAt: 'person.createdAt',
  updatedAt: 'person.updatedAt',
};

interface PersonDateState {
  fullName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  birthDatePrecision?: DatePrecision | null;
  deathDatePrecision?: DatePrecision | null;
  isDeceased?: boolean;
}

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePersonDto): Promise<PersonResponseDto> {
    const saved = await this.createPersonEntity(
      this.personRepository.manager,
      dto,
    );

    return toPersonResponse(saved);
  }

  async addSpouse(id: string, dto: AddSpouseDto): Promise<PersonResponseDto> {
    this.assertTarget(dto);
    this.assertMarriageDates(dto);

    return this.dataSource.transaction(async (manager) => {
      const person = await this.findEntity(id, manager);
      const spouse = await this.resolveTarget(manager, dto);

      if (spouse.id === person.id) {
        throw unprocessable('A person cannot be linked as their own spouse.');
      }

      const relation = manager.create(Spouse, {
        personAId: person.id,
        personBId: spouse.id,
        marriageDate: dto.marriageDate ?? null,
        endDate: dto.endDate ?? null,
        endReason: dto.endReason ?? null,
      });

      await this.persist(() => manager.save(relation), {
        conflict:
          'These persons are already recorded as spouses with that marriage date.',
      });

      return toPersonResponse(spouse);
    });
  }

  async addParent(id: string, dto: AddParentDto): Promise<PersonResponseDto> {
    this.assertTarget(dto);

    return this.dataSource.transaction(async (manager) => {
      const child = await this.findEntity(id, manager);
      const parent = await this.resolveTarget(manager, dto);

      await this.linkParentChild(manager, {
        parentId: parent.id,
        childId: child.id,
        parentRole: this.resolveParentRole(
          dto.parentRole,
          parent,
          'added parent',
        ),
        kind: dto.kind ?? ParentChildKind.BIOLOGICAL,
      });

      return toPersonResponse(parent);
    });
  }

  async addChild(id: string, dto: AddChildDto): Promise<PersonResponseDto> {
    this.assertTarget(dto);

    return this.dataSource.transaction(async (manager) => {
      const parent = await this.findEntity(id, manager);
      const child = await this.resolveTarget(manager, dto);

      await this.linkParentChild(manager, {
        parentId: parent.id,
        childId: child.id,
        parentRole: this.resolveParentRole(
          dto.parentRole,
          parent,
          'person in the path',
        ),
        kind: dto.kind ?? ParentChildKind.BIOLOGICAL,
      });

      return toPersonResponse(child);
    });
  }

  async findAll(
    query: QueryPersonsDto,
    options: { allowDeleted: boolean },
  ): Promise<PaginatedResponseDto<PersonResponseDto>> {
    if (query.includeDeleted && !options.allowDeleted) {
      throw new AppException(
        ErrorCode.FORBIDDEN,
        'Only administrators can list soft-deleted persons.',
        HttpStatus.FORBIDDEN,
      );
    }

    const qb = this.personRepository.createQueryBuilder('person');

    if (query.includeDeleted) {
      qb.withDeleted();
    }

    if (query.search?.trim()) {
      const search = `%${escapeLike(query.search.trim())}%`;
      qb.andWhere(
        `(unaccent(person.fullName) ILIKE unaccent(:search) ESCAPE '\\'` +
          ` OR unaccent(person.commonName) ILIKE unaccent(:search)` +
          ` ESCAPE '\\')`,
        { search },
      );
    }

    if (query.gender) {
      qb.andWhere('person.gender = :gender', { gender: query.gender });
    }

    if (query.isDeceased !== undefined) {
      qb.andWhere('person.isDeceased = :isDeceased', {
        isDeceased: query.isDeceased,
      });
    }

    qb.orderBy(
      SORT_COLUMNS[query.sortBy],
      query.sortOrder === 'asc' ? 'ASC' : 'DESC',
      'NULLS LAST',
    )
      .addOrderBy('person.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [rows, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(rows.map(toPersonResponse), total, query);
  }

  async findOne(id: string): Promise<PersonResponseDto> {
    const person = await this.findEntity(id);

    return toPersonResponse(person);
  }

  async findRelations(id: string): Promise<PersonRelationsDto> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: {
        parentRelations: { parent: true },
        childrenRelations: { child: true },
        spousesAsA: { personB: true },
        spousesAsB: { personA: true },
      },
    });

    if (!person) {
      throw personNotFound();
    }

    const parents = (person.parentRelations ?? [])
      .filter((link) => link.parent)
      .map((link) => ({
        person: toPersonSummary(link.parent),
        parentRole: link.parentRole,
        kind: link.kind,
      }));

    const children = (person.childrenRelations ?? [])
      .filter((link) => link.child)
      .map((link) => ({
        person: toPersonSummary(link.child),
        parentRole: link.parentRole,
        kind: link.kind,
      }));

    const spouses = new Map<string, PersonRelationsDto['spouses'][number]>();

    for (const link of person.spousesAsA ?? []) {
      if (link.personB) {
        spouses.set(link.personB.id, {
          person: toPersonSummary(link.personB),
          marriageDate: link.marriageDate,
          endDate: link.endDate,
          endReason: link.endReason,
        });
      }
    }

    for (const link of person.spousesAsB ?? []) {
      if (link.personA && !spouses.has(link.personA.id)) {
        spouses.set(link.personA.id, {
          person: toPersonSummary(link.personA),
          marriageDate: link.marriageDate,
          endDate: link.endDate,
          endReason: link.endReason,
        });
      }
    }

    return {
      person: toPersonSummary(person),
      parents,
      children,
      spouses: [...spouses.values()],
    };
  }

  async update(id: string, dto: UpdatePersonDto): Promise<PersonResponseDto> {
    const person = await this.findEntity(id);
    const patch = this.buildPatch(dto);

    this.applyDeceasedDefault(patch);
    this.assertConsistent({
      fullName: pick(patch.fullName, person.fullName),
      birthDate: pick(patch.birthDate, person.birthDate),
      deathDate: pick(patch.deathDate, person.deathDate),
      birthDatePrecision: pick(
        patch.birthDatePrecision,
        person.birthDatePrecision,
      ),
      deathDatePrecision: pick(
        patch.deathDatePrecision,
        person.deathDatePrecision,
      ),
      isDeceased: pick(patch.isDeceased, person.isDeceased),
    });

    Object.assign(person, patch);
    const saved = await this.persist(() => this.personRepository.save(person));

    return toPersonResponse(saved);
  }

  async remove(id: string): Promise<void> {
    await this.findEntity(id);
    const result = await this.personRepository.softDelete({ id });

    if (!result.affected) {
      throw personNotFound();
    }
  }

  async restore(id: string): Promise<PersonResponseDto> {
    const result = await this.personRepository.restore({ id });

    if (!result.affected) {
      throw personNotFound();
    }

    return toPersonResponse(await this.findEntity(id));
  }

  private async findEntity(
    id: string,
    manager?: EntityManager,
  ): Promise<Person> {
    const repository = manager
      ? manager.getRepository(Person)
      : this.personRepository;
    const person = await repository.findOne({ where: { id } });

    if (!person) {
      throw personNotFound();
    }

    return person;
  }

  private async createPersonEntity(
    manager: EntityManager,
    dto: CreatePersonDto,
  ): Promise<Person> {
    const patch = this.buildPatch(dto);
    this.applyDeceasedDefault(patch);
    this.assertConsistent(patch);

    const person = manager.create(Person, patch);

    return this.persist(() => manager.save(person));
  }

  private assertTarget(dto: AddRelationTargetDto): void {
    const hasId = dto.personId !== undefined && dto.personId !== null;
    const hasPerson = dto.person !== undefined && dto.person !== null;

    if (hasId === hasPerson) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Provide exactly one of personId (link an existing person) or person ' +
          '(create a new person).',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertMarriageDates(dto: AddSpouseDto): void {
    if (
      dto.marriageDate != null &&
      dto.endDate != null &&
      dto.endDate < dto.marriageDate
    ) {
      throw unprocessable('endDate must not be earlier than marriageDate.');
    }
  }

  private async resolveTarget(
    manager: EntityManager,
    dto: AddRelationTargetDto,
  ): Promise<Person> {
    if (dto.personId) {
      const person = await manager
        .getRepository(Person)
        .findOne({ where: { id: dto.personId } });

      if (!person) {
        throw personNotFound();
      }

      return person;
    }

    return this.createPersonEntity(manager, dto.person as CreatePersonDto);
  }

  private resolveParentRole(
    explicit: ParentRole | undefined,
    parent: Person,
    subject: string,
  ): ParentRole {
    if (explicit) {
      return explicit;
    }

    if (parent.gender === PersonGender.MALE) {
      return ParentRole.FATHER;
    }

    if (parent.gender === PersonGender.FEMALE) {
      return ParentRole.MOTHER;
    }

    throw unprocessable(
      `parentRole is required because the ${subject} does not have a male or ` +
        'female gender recorded.',
    );
  }

  private async linkParentChild(
    manager: EntityManager,
    input: {
      parentId: string;
      childId: string;
      parentRole: ParentRole;
      kind: ParentChildKind;
    },
  ): Promise<void> {
    if (input.parentId === input.childId) {
      throw unprocessable('A person cannot be their own parent or child.');
    }

    const cycle = await manager.query<Array<{ found: number }>>(
      `WITH RECURSIVE ancestors AS (
         SELECT parent_id FROM parent_child WHERE child_id = $1
         UNION
         SELECT link.parent_id
         FROM parent_child link
         INNER JOIN ancestors ON link.child_id = ancestors.parent_id
       )
       SELECT 1 AS found
       FROM ancestors
       WHERE parent_id = $2
       LIMIT 1`,
      [input.parentId, input.childId],
    );

    if (cycle.length > 0) {
      throw unprocessable(
        'This link would create a cycle: the chosen child is already an ' +
          'ancestor of the chosen parent.',
      );
    }

    const relation = manager.create(ParentChild, input);

    await this.persist(() => manager.save(relation), {
      conflict:
        'This parent-child relationship already exists, or the child already ' +
        'has a biological parent in that role.',
    });
  }

  private buildPatch(dto: CreatePersonDto | UpdatePersonDto): Partial<Person> {
    const patch: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) {
        continue;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        patch[key] = trimmed.length === 0 ? null : trimmed;
      } else {
        patch[key] = value;
      }
    }

    return patch;
  }

  private applyDeceasedDefault(patch: Partial<Person>): void {
    if (patch.deathDate != null && patch.isDeceased === undefined) {
      patch.isDeceased = true;
    }
  }

  private assertConsistent(state: PersonDateState): void {
    if (state.fullName === null || state.fullName === '') {
      throw unprocessable('fullName must not be empty.');
    }

    for (const [field, value] of [
      ['birthDate', state.birthDate],
      ['deathDate', state.deathDate],
    ] as const) {
      if (value != null && !isRealDate(value)) {
        throw unprocessable(`${field} must be a real calendar date.`);
      }
    }

    if (state.birthDatePrecision != null && state.birthDate == null) {
      throw unprocessable('birthDatePrecision requires birthDate.');
    }

    if (state.deathDatePrecision != null && state.deathDate == null) {
      throw unprocessable('deathDatePrecision requires deathDate.');
    }

    if (
      state.birthDate != null &&
      state.deathDate != null &&
      state.deathDate < state.birthDate
    ) {
      throw unprocessable('deathDate must not be earlier than birthDate.');
    }

    if (state.deathDate != null && state.isDeceased === false) {
      throw unprocessable('deathDate requires isDeceased to be true.');
    }
  }

  private async persist<T>(
    operation: () => Promise<T>,
    messages: { invalid?: string; conflict?: string } = {},
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string } | undefined)?.code;

        if (code === '23514' || code === '23503' || code === '22P02') {
          throw unprocessable(
            messages.invalid ??
              'The person data violates a database constraint.',
          );
        }

        if (code === '23505') {
          throw new AppException(
            ErrorCode.CONFLICT,
            messages.conflict ??
              'The person conflicts with an existing record.',
            HttpStatus.CONFLICT,
          );
        }
      }

      throw error;
    }
  }
}

function pick<T>(next: T | undefined, current: T): T {
  return next === undefined ? current : next;
}

function personNotFound(): AppException {
  return new AppException(
    ErrorCode.NOT_FOUND,
    'Person not found.',
    HttpStatus.NOT_FOUND,
  );
}

function unprocessable(message: string): AppException {
  return new AppException(
    ErrorCode.UNPROCESSABLE_ENTITY,
    message,
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
}

function isRealDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
