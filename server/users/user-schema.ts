import { z } from 'zod';

export const create_token_request = z.object({
	email: z.email("This doesn't look like a valid email address"),
	password: z
	.string()
	.min(8, 'Passwords must have at least 8 characters')
	.max(72, "Passwords can't be longer than 72 characters")
	.regex(/^[ -~]+$/, 'Passwords must contain only printable ASCII characters'),
});

export type CreateTokenResponse = {
	token: string;
};

export const create_user_request = z.object({
	first_name: z.string().max(100),
	last_name: z.string().max(100),
	email: z.email().max(100),
	password: z
	.string()
	.min(8)
	.max(72)
	.regex(/^[ -~]+$/),
});

export type CreateUserRequest = z.infer<typeof create_user_request>;
