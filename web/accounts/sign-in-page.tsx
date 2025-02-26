import * as stylex from '@stylexjs/stylex';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import cookies from 'js-cookie';
import { RiAppleFill, RiGoogleFill, RiMetaFill } from 'react-icons/ri';
import { z } from 'zod';

import { button_styles } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { text_input_styles } from '@/components/text-input';
import { orpc } from '@/lib/orpc';

import { tokens } from '../_app/tokens.stylex';

export const Route = createFileRoute('/accounts/sign-in')({
	component: SignInPage,
});

const routeApi = getRouteApi('/accounts/sign-in');

function SignInPage() {
	const navigate = routeApi.useNavigate();

	const createToken = useMutation(
		orpc.users.create_token.mutationOptions({
			onSuccess: ({ token }) => {
				cookies.set('session_token', token, { expires: 365 });
				void navigate({ to: '/library' });
			},
		}),
	);

	const { Field, Subscribe, handleSubmit } = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
		onSubmit: async ({ value }) => {
			await createToken.mutateAsync(value);
		},
	});

	return (
		<div className="h-dvh overflow-auto" style={{ scrollbarGutter: 'stable' }}>
			<div className="flex min-h-dvh flex-col items-center bg-[oklch(96%_0_0)] p-8">
				<div className="w-100 rounded-xl bg-white p-8 shadow-sm ring-1 ring-[oklch(92%_0_0)]">
					<div className="text-xl font-bold">Sign in to your account</div>
					<div className="mt-2 text-sm text-[oklch(56%_0_0)]">
						Enter your email and pick up where you left off
					</div>
					<form
						className="mt-6 flex flex-col"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleSubmit();
						}}>
						<Field
							name="email"
							validators={{
								onChange: ({ value }) => {
									const { success, error } = schema.shape.email.safeParse(value);
									if (!success) return error.errors;
								},
							}}>
							{(field) => {
								const { errors } = field.state.meta;
								const error = errors.length > 0;

								return (
									<>
										<label
											className={clsx('text-sm font-medium', { 'text-red-600': error })}
											htmlFor={field.name}>
											Email
										</label>
										<input
											name={field.name}
											id={field.name}
											placeholder="example@mail.com"
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(e.target.value)}
											{...stylex.props(text_input_styles.base)}
										/>
										{!!error && (
											<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
												{errors[0]?.message}
											</div>
										)}
									</>
								);
							}}
						</Field>
						<Field
							name="password"
							validators={{
								onChange: ({ value }) => {
									const { success, error } = schema.shape.password.safeParse(value);
									if (!success) return error.errors;
								},
							}}>
							{(field) => {
								const { errors } = field.state.meta;
								const error = errors.length > 0;

								return (
									<>
										<label
											className={clsx('mt-6 text-sm font-medium', { 'text-red-600': error })}
											htmlFor={field.name}>
											Password
										</label>
										<input
											name={field.name}
											id={field.name}
											placeholder="••••••••"
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(e.target.value)}
											{...stylex.props(text_input_styles.base)}
										/>
										{!!error && (
											<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
												{errors[0]?.message}
											</div>
										)}
									</>
								);
							}}
						</Field>
						<Subscribe selector={state => state.isSubmitting}>
							{(isSubmitting) => {
								return (
									<button
										type="submit"
										{...stylex.props(button_styles.base, styles.sign_in_button)}>
										{isSubmitting ? <Spinner className="size-5 animate-spin" /> : 'Sign In'}
									</button>
								);
							}}
						</Subscribe>
					</form>
					<div className="relative mt-6 text-center">
						<div className="absolute inset-x-0 top-[50%] border-t border-[oklch(92%_0_0)]" />
						<span className="relative bg-white px-2 text-sm text-[oklch(56%_0_0)]">
							Or continue with
						</span>
					</div>
					<div className="mt-6 flex gap-4">
						<button type="button" {...stylex.props(styles.sso_button)}>
							<RiAppleFill className="text-base" />
						</button>
						<button type="button" {...stylex.props(styles.sso_button)}>
							<RiGoogleFill className="text-base" />
						</button>
						<button type="button" {...stylex.props(styles.sso_button)}>
							<RiMetaFill className="text-base" />
						</button>
					</div>
					<div className="mt-6 text-center text-sm">
						Do not have an account?
						{' '}
						<Link className="underline underline-offset-2" to="/accounts/sign-up">
							Sign up
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

const styles = stylex.create({
	sign_in_button: {
		marginTop: 24,
	},
	sso_button: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		paddingBlock: 10,
		paddingInline: 16,
		cursor: 'pointer',
		backgroundColor: {
			':hover': 'oklch(96% 0 0)',
		},
		borderRadius: 6,
		boxShadow: `0 0 0 1px oklch(92% 0 0), ${tokens.shadow_sm}`,
	},
});

const schema = z.object({
	email: z.email("This doesn't look like a valid email address"),
	password: z
	.string()
	.min(8, 'Passwords must have at least 8 characters')
	.max(72, "Passwords can't be longer than 72 characters")
	.regex(/^[ -~]+$/, 'Passwords must contain only printable ASCII characters'),
});
