import type { Person } from '../../database/entities/person.entity';
import type { PersonResponseDto } from './dto/person-response.dto';
import type { PersonSummaryDto } from './dto/person-relations.dto';

export function toPersonResponse(person: Person): PersonResponseDto {
  return {
    id: person.id,
    fullName: person.fullName,
    commonName: person.commonName,
    gender: person.gender,
    avatarUrl: person.avatarUrl,
    birthOrder: person.birthOrder,
    birthDate: person.birthDate,
    birthDatePrecision: person.birthDatePrecision,
    deathDate: person.deathDate,
    deathDatePrecision: person.deathDatePrecision,
    deathLunarDate: person.deathLunarDate,
    isDeceased: person.isDeceased,
    hometown: person.hometown,
    currentAddress: person.currentAddress,
    phone: person.phone,
    occupation: person.occupation,
    bio: person.bio,
    burialPlace: person.burialPlace,
    notes: person.notes,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    deletedAt: person.deletedAt ?? null,
  };
}

export function toPersonSummary(person: Person): PersonSummaryDto {
  return {
    id: person.id,
    fullName: person.fullName,
    commonName: person.commonName,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    isDeceased: person.isDeceased,
    avatarUrl: person.avatarUrl,
  };
}
