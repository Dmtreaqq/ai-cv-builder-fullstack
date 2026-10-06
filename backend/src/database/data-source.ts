import 'reflect-metadata';
import 'dotenv/config';
import { extname, join } from 'node:path';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm-options.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

// `.ts` when the CLI runs the source through tsx, `.js` when it runs the build (Docker image).
const ext = extname(import.meta.filename);

export default new DataSource({
  ...buildTypeOrmOptions(databaseUrl),
  entities: [join(import.meta.dirname, '..', '**', `*.entity${ext}`)],
  migrations: [join(import.meta.dirname, 'migrations', `*${ext}`)],
});
