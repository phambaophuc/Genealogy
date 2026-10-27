import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Role } from '../../common/enums/role.enum';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthConfig } from '../../config';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';

/**
 * Minimal authentication service used by the demo login route.
 *
 * TODO: replace the demo credentials check with a real user store and a proper
 * password hash (argon2/bcrypt) when starting a project.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const auth = this.configService.getOrThrow<AuthConfig>('auth');

    if (!auth.demoEnabled) {
      // Do not reveal whether the demo endpoint exists in production.
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'The requested resource was not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    const email = dto.email.trim().toLowerCase();
    const expectedEmail = auth.demoEmail.trim().toLowerCase();

    // Compare both values in constant time to avoid user enumeration by timing.
    const emailMatches = safeEqual(email, expectedEmail);
    const passwordMatches = safeEqual(dto.password, auth.demoPassword);

    if (!emailMatches || !passwordMatches) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user: AuthenticatedUser = {
      sub: 'demo-user',
      email: expectedEmail,
      name: 'Demo User',
      roles: [Role.ADMIN],
    };

    const accessToken = await this.jwtService.signAsync({
      sub: user.sub,
      email: user.email,
      name: user.name,
      roles: user.roles,
      type: 'access',
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: auth.jwtExpiresIn,
      user: this.toUserProfile(user),
    };
  }

  toUserProfile(user: AuthenticatedUser): UserProfileDto {
    return {
      id: user.sub,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };
  }
}

function safeEqual(left: string, right: string): boolean {
  // Hash first so inputs of different lengths can still be compared safely.
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();

  return timingSafeEqual(leftHash, rightHash);
}
