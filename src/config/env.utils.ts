/**
 * Small helpers to read environment variables that were already validated by Joi.
 * Keeping the parsing here avoids repeating defensive checks across config files.
 */

export function toBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toList(
  value: string | undefined,
  fallback: string[] = [],
): string[] {
  if (!value) {
    return fallback;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
