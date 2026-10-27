import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  ssl: boolean;
  logging: boolean;
  migrationsRun: boolean;
  poolMax: number;
}

export default registerAs('database', (): DatabaseConfig => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  name: process.env.DB_NAME ?? 'gia_pha',
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.DB_LOGGING === 'true',
  migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  poolMax: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
}));
