import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RequestWithContext } from '../interfaces/request-with-context.interface';

/**
 * Injects the authenticated user, or one of its properties.
 *
 * @example
 * getProfile(@CurrentUser() user: AuthenticatedUser) {}
 * getProfile(@CurrentUser('sub') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ):
    | AuthenticatedUser
    | AuthenticatedUser[keyof AuthenticatedUser]
    | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
