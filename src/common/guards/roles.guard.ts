import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code';
import { RequestWithContext } from '../interfaces/request-with-context.interface';

/**
 * Global role guard. It runs after JwtAuthGuard and only enforces routes that
 * declare @Roles(...). Endpoints without @Roles() remain available to any
 * authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;

    if (!user) {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'Authentication is required.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const allowed = requiredRoles.some((role) => user.roles.includes(role));

    if (!allowed) {
      throw new AppException(
        ErrorCode.FORBIDDEN,
        'You do not have permission to perform this action.',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
