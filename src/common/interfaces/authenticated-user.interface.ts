import { Role } from '../enums/role.enum';

/**
 * Shape attached to `request.user` after a JWT is successfully verified.
 * Keep this in sync with `JwtPayload` when issuing tokens.
 */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  name?: string;
  roles: Role[];
}
