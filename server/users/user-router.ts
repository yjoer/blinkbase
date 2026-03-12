import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { auth, base } from '@/app/middleware';
import { pool } from '@/lib/postgresql';

import { UserRepository } from './user-repository';
import { create_token_request, create_user_request } from './user-schema';

import type { UserRow } from './user-repository';
import type { CreateTokenResponse } from './user-schema';

const users = new UserRepository(pool);

export const create_token = base
.input(create_token_request)
.handler(async ({ errors, input }): Promise<CreateTokenResponse> => {
	const { email, password } = input;

	const { rows } = await users.find_by_email(email);
	const user = rows[0];
	if (!user) throw errors.UNAUTHORIZED();

	const match = await bcrypt.compare(password, user.password);
	if (!match) throw errors.UNAUTHORIZED();

	const secret = process.env.APP_SECRET || '';

	const token = jwt.sign({ user_id: user.user_id }, secret, {
		expiresIn: '365d',
		jwtid: Date.now().toString(),
	});

	// save in redis
	// await users.createToken(user.user_id, expiresIn, jwtId);

	return { token };
});

export const create_user = base
.input(create_user_request)
.handler(async ({ input }): Promise<void> => {
	const { first_name, last_name, email, password } = input;

	const hash = await bcrypt.hash(password, 10);
	await users.create({ first_name, last_name, email, password: hash });
});

export const find_by_id = auth
.handler(async ({ context }): Promise<UserRow | undefined> => {
	const { user_id } = context;
	const { rows } = await users.find_by_id(user_id);

	return rows[0];
});
