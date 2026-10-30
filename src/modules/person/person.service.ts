import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import type { DatePrecision } from '../../database/entities/genealogy.enums';
import { Person } from '../../database/entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonRelationsDto } from './dto/person-relations.dto';
import type { PersonResponseDto } from './dto/person-response.dto';
import type { PersonSortField } from './dto/query-persons.dto';
import { QueryPersonsDto } from './dto/query-persons.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { toPersonResponse, toPersonSummary } from './person.mapper';

/**
 * Columns a client may sort by. Never interpolate a raw `sortBy` value into the
 * query - the whitelist above is what keeps ordering injection-free.
 */
const SORT_COLUMNS: Record<PersonSortField, string> = {
  fullName: 'person.fullName',
  birthDate: 'person.birthDate',
  createdAt: 'person.createdAt',
  updatedAt: 'person.updatedAt',
};

/** Subset of a person used for the cross-field checks below. */
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
  ) {}

  async create(dto: CreatePersonDto): Promise<PersonResponseDto> {
    const patch = this.buildPatch(dto);
    this.applyDeceasedDefault(patch);
    this.assertConsistent(patch);

    const person = this.personRepository.create(patch);
    const saved = await this.persist(() => this.personRepository.save(person));

    return toPersonResponse(saved);
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

  private async findEntity(id: string): Promise<Person> {
    const person = await this.personRepository.findOne({ where: { id } });

    if (!person) {
      throw personNotFound();
    }

    return person;
  }

  /**
   * Keeps only the keys the client actually sent, trims strings and turns an
   * empty string back into NULL so optional columns stay empty instead of ''.
   */
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

  /** A death date implies is_deceased unless the client says otherwise. */
  private applyDeceasedDefault(patch: Partial<Person>): void {
    if (patch.deathDate != null && patch.isDeceased === undefined) {
      patch.isDeceased = true;
    }
  }

  /**
   * Mirrors the CHECK constraints on the persons table, but returns a readable
   * 422 instead of letting Postgres reject the write.
   */
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

  /** Translates raw Postgres constraint failures into API-level errors. */
  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string } | undefined)?.code;

        if (code === '23514' || code === '23503' || code === '22P02') {
          throw unprocessable(
            'The person data violates a database constraint.',
          );
        }

        if (code === '23505') {
          throw new AppException(
            ErrorCode.CONFLICT,
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

/** Rejects 2024-02-31 and other values Date.parse would silently roll over. */
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
