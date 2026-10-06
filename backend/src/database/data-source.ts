import 'reflect-metadata';
import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm-options.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

export default new DataSource({
  ...buildTypeOrmOptions(databaseUrl),
  entities: [join(import.meta.dirname, '..', '**', '*.entity.ts')],
  migrations: [join(import.meta.dirname, 'migrations', '*.ts')],
});
