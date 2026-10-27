import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';
import type { DatabaseConfig } from '../config/database.config';

export type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

export function buildDataSourceOptions(db: DatabaseConfig): PostgresOptions {
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.name,
    ssl: db.ssl ? { rejectUnauthorized: true } : false,
    logging: db.logging,
    extra: { max: db.poolMax },
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'each',
    synchronize: false,
  };
}
