import appConfig from './app.config';
import authConfig from './auth.config';
import databaseConfig from './database.config';
import loggingConfig from './logging.config';
import swaggerConfig from './swagger.config';
import throttlerConfig from './throttler.config';

export {
  appConfig,
  authConfig,
  databaseConfig,
  loggingConfig,
  swaggerConfig,
  throttlerConfig,
};

export type { AppConfig } from './app.config';
export type { AuthConfig } from './auth.config';
export type { DatabaseConfig } from './database.config';
export type { LoggingConfig } from './logging.config';
export type { SwaggerConfig } from './swagger.config';
export type { ThrottlerConfig } from './throttler.config';

export const configLoaders = [
  appConfig,
  authConfig,
  databaseConfig,
  loggingConfig,
  swaggerConfig,
  throttlerConfig,
];
