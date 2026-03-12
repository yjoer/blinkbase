import { z } from 'zod';

export const create_token_request = z.object({
	email: z.email("This doesn't look like a valid email address").max(100),
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
	first_name: z.string().nonempty('We\'d love to call you something besides "Hey!"').max(100),
	last_name: z.string().nonempty('A last name would be the cherry on top!').max(100),
	email: z.email("This doesn't look like a valid email address").max(100),
	password: z
	.string()
	.min(8, 'Passwords must have at least 8 characters')
	.max(72, "Passwords can't be longer than 72 characters")
	.regex(/^[ -~]+$/, 'Passwords must contain only printable ASCII characters'),
});

export type CreateUserRequest = z.infer<typeof create_user_request>;
