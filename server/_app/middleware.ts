// oxlint-disable no-empty-object-type
import { os } from '@orpc/server';
import { getCookie } from '@orpc/server/helpers';
import { RequestHeadersPluginContext } from '@orpc/server/plugins';
import jwt from 'jsonwebtoken';

import type { JwtPayload } from 'jsonwebtoken';

export interface ORPCContext extends RequestHeadersPluginContext {}

export const base = os.$context<ORPCContext>().errors({
	UNAUTHORIZED: {},
});

const auth_middleware = base.middleware(async ({ context, errors, next }) => {
	const session_token = getCookie(context.reqHeaders, 'session_token');
	if (!session_token) throw errors.UNAUTHORIZED();

	const secret = process.env.APP_SECRET || '';
	let user_id: string;

	try {
		({ user_id } = jwt.verify(session_token, secret) as JwtPayload);
	} catch {
		throw errors.UNAUTHORIZED();
	}

	return next({
		context: {
			user_id,
		},
	});
});

export const auth = base.use(auth_middleware);
