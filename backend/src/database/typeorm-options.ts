import type { DataSourceOptions } from 'typeorm';

export function buildTypeOrmOptions(url: string): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    synchronize: false,
    uuidExtension: 'pgcrypto',
  };
}
