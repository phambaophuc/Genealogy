import { ConfigType, registerAs } from '@nestjs/config';
import { toBoolean } from './env.utils';

const swaggerConfig = registerAs('swagger', () => ({
  enabled: toBoolean(process.env.SWAGGER_ENABLED, true),
  path: process.env.SWAGGER_PATH ?? 'docs',
  title: process.env.SWAGGER_TITLE ?? 'NestJS Base API',
  description:
    process.env.SWAGGER_DESCRIPTION ??
    'Opinionated NestJS base: configuration, validation, errors, logging, Swagger and security.',
}));

export default swaggerConfig;

export type SwaggerConfig = ConfigType<typeof swaggerConfig>;
