import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
  ssl: process.env.DB_SSL === 'true',
  redisUrl: process.env.REDIS_URL as string,
}));
