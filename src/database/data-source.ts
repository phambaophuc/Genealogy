import 'dotenv/config';
import { DataSource } from 'typeorm';
import databaseConfig from '../config/database.config';
import { buildDataSourceOptions } from './typeorm.config';

export default new DataSource(buildDataSourceOptions(databaseConfig()));
