import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../app.module';

/** TypeORM CLI does not load `.env`. Values already in the process win. */
function loadEnvFile(): void {
  const path = resolve(__dirname, '../../.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf('=');
    if (!trimmed || trimmed.startsWith('#') || separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    const quoted = value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0];
    if (quoted) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ENTITIES,
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  synchronize: false,
});

export default AppDataSource;
