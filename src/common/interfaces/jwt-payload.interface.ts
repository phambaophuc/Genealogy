import { AuthenticatedUser } from './authenticated-user.interface';

export interface JwtPayload extends AuthenticatedUser {
  type?: 'access';
}
