import { ConfigType, registerAs } from '@nestjs/config';
import { toBoolean } from './env.utils';

const loggingConfig = registerAs('logging', () => ({
  level: process.env.LOG_LEVEL ?? 'info',
  pretty: toBoolean(
    process.env.LOG_PRETTY,
    process.env.NODE_ENV !== 'production',
  ),
}));

export default loggingConfig;

export type LoggingConfig = ConfigType<typeof loggingConfig>;
