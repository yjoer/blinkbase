import type { CreateUserRequest } from './user-schema';
import type { Pool, PoolClient } from 'pg';

export class UserRepository {
	private pg: Pool | PoolClient;

	constructor(pg: Pool | PoolClient) {
		this.pg = pg;
	}

	find_by_id(user_id: string) {
		const query = `
		select user_id, first_name, last_name, email_address
		from users
		where user_id = $1
		`;

		return this.pg.query<UserRow>(query, [user_id]);
	}

	find_by_email(email: string) {
		const query = `
		select user_id, first_name, last_name, email_address, password
		from users
		where email_address = $1
		`;

		return this.pg.query<UserWithPasswordRow>(query, [email]);
	}

	create({ first_name, last_name, email, password }: CreateUserRequest) {
		const query = `
		insert into users (first_name, last_name, email_address, password)
		values ($1, $2, $3, $4)
		`;

		return this.pg.query(query, [first_name, last_name, email, password]);
	}
}

export type UserRow = {
	user_id: string;
	first_name: string;
	last_name: string;
	email_address: string;
};

type UserWithPasswordRow = {
	user_id: string;
	first_name: string;
	last_name: string;
	email_address: string;
	password: string;
};

if (import.meta.vitest) {
	const { it, expect, beforeAll, afterAll } = import.meta.vitest;

	let pool: Pool;
	let client: PoolClient;
	let users: UserRepository;

	beforeAll(async () => {
		({ pool } = await import('@/lib/postgresql'));
		client = await pool.connect();
		users = new UserRepository(client);
	});

	afterAll(async () => {
		await pool.end();
	});

	it('should create and find a user by email', async () => {
		const user = { first_name: 'a', last_name: 'b', email: 'c', password: 'd' };

		await client.query('begin');

		await users.create(user);
		const { rows } = await users.find_by_email('c');

		await client.query('rollback');
		client.release();

		expect(rows).toEqual([
			{
				user_id: expect.any(String),
				first_name: 'a',
				last_name: 'b',
				email_address: 'c',
				password: 'd',
			},
		]);
	});
}
