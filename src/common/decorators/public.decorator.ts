import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or a whole controller) as accessible without a JWT.
 * The global JwtAuthGuard checks this metadata.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
