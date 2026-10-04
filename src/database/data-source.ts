import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../app.module';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ENTITIES,
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  synchronize: false,
});

export default AppDataSource;
