import { Pool } from 'pg';

export const pool = new Pool({
	host: process.env.DB_HOST,
	port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
});
