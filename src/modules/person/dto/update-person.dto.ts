import { PartialType } from '@nestjs/swagger';
import { CreatePersonDto } from './create-person.dto';

/**
 * Every field is optional; only the provided keys are written. Sending `null`
 * clears an optional column, while omitting a key leaves it untouched.
 *
 * Cross-field rules (death after birth, precision requires a date, ...) are
 * re-checked in PersonService against the merged state, not just the payload.
 */
export class UpdatePersonDto extends PartialType(CreatePersonDto) {}
