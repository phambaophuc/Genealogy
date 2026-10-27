import { ConfigType, registerAs } from '@nestjs/config';
import { toBoolean, toList, toNumber } from './env.utils';

const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'NestJS Base',
  version: process.env.APP_VERSION ?? '1.0.0',
  env: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? '1',
  corsOrigins: toList(process.env.CORS_ORIGINS, ['*']),
  trustProxy: toBoolean(process.env.TRUST_PROXY, false),
  isProduction: process.env.NODE_ENV === 'production',
}));

export default appConfig;

export type AppConfig = ConfigType<typeof appConfig>;
