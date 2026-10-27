import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * Escape hatch for endpoints that must not use the standard success envelope,
 * e.g. streams, file downloads or third-party webhooks.
 */
export const SkipResponseTransform = () =>
  SetMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true);
