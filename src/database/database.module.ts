import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DatabaseConfig } from '../config/database.config';
import { buildDataSourceOptions } from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.getOrThrow<DatabaseConfig>('database');
        return {
          ...buildDataSourceOptions(db),
          autoLoadEntities: true,
          migrationsRun: db.migrationsRun,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
