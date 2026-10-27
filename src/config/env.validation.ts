import Joi from 'joi';

const NODE_ENVS = ['development', 'test', 'production'] as const;

/**
 * Fail fast on boot when the environment is incomplete or malformed.
 * Keep this schema in sync with `.env.example`.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(...NODE_ENVS)
    .default('development'),

  APP_NAME: Joi.string().default('NestJS Base'),
  APP_VERSION: Joi.string().default('1.0.0'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('1'),
  CORS_ORIGINS: Joi.string().default('*'),
  TRUST_PROXY: Joi.boolean().default(false),

  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required':
      "JWT_SECRET is required. Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    'string.min': 'JWT_SECRET must be at least 32 characters long',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  DEMO_AUTH_ENABLED: Joi.boolean().optional(),
  DEMO_AUTH_EMAIL: Joi.string().email().default('admin@example.com'),
  DEMO_AUTH_PASSWORD: Joi.string().min(8).default('Admin@123456'),

  THROTTLE_TTL_MS: Joi.number().integer().min(1_000).default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  LOG_PRETTY: Joi.boolean().optional(),

  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('docs'),
  SWAGGER_TITLE: Joi.string().default('NestJS Base API'),
  SWAGGER_DESCRIPTION: Joi.string().allow('').optional(),
}).unknown(true);

/**
 * ConfigModule v12 no longer accepts a Joi schema directly (it expects a
 * Standard Schema). This adapter keeps Joi as the single source of truth.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  }) as Joi.ValidationResult<Record<string, unknown>>;

  if (result.error) {
    const details = result.error.details
      .map((detail) => ` - ${detail.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${details}`);
  }

  return result.value;
}
