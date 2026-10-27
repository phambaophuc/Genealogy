import { ValidationError } from 'class-validator';

export interface ValidationErrorDetail {
  field: string;
  messages: string[];
}

/**
 * Flattens class-validator's nested error tree into a small, predictable list.
 */
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownErrors: ValidationErrorDetail[] = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    const childErrors = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];

    return [...ownErrors, ...childErrors];
  });
}
