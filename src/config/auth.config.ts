import { ConfigType, registerAs } from '@nestjs/config';
import { toBoolean } from './env.utils';

const authConfig = registerAs('auth', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    /**
     * The demo login endpoint makes the base project immediately testable.
     * It is disabled by default in production: wire a real user store instead.
     */
    demoEnabled: toBoolean(process.env.DEMO_AUTH_ENABLED, !isProduction),
    demoEmail: process.env.DEMO_AUTH_EMAIL ?? 'admin@example.com',
    demoPassword: process.env.DEMO_AUTH_PASSWORD ?? 'Admin@123456',
  };
});

export default authConfig;

export type AuthConfig = ConfigType<typeof authConfig>;
