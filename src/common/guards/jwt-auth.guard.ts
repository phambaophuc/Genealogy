import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithContext } from '../interfaces/request-with-context.interface';

/**
 * Global authentication guard. Routes marked with @Public() are skipped.
 * Tokens are expected as `Authorization: Bearer <jwt>`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'Authentication token is missing.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (payload.type && payload.type !== 'access') {
        throw new Error('Unexpected token type');
      }

      request.user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.roles ?? [],
      };

      return true;
    } catch {
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        'Authentication token is invalid or expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
