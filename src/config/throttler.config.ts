import { ConfigType, registerAs } from '@nestjs/config';
import { toNumber } from './env.utils';

const throttlerConfig = registerAs('throttler', () => ({
  // Throttler v5+ expects TTL in milliseconds.
  ttl: toNumber(process.env.THROTTLE_TTL_MS, 60_000),
  limit: toNumber(process.env.THROTTLE_LIMIT, 100),
}));

export default throttlerConfig;

export type ThrottlerConfig = ConfigType<typeof throttlerConfig>;
