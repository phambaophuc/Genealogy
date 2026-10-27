import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.interface';

/**
 * Express request enriched by JwtAuthGuard.
 * pino-http already augments `Request` with the `id` property.
 */
export interface RequestWithContext extends Request {
  user?: AuthenticatedUser;
}
