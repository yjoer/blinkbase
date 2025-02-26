import * as stylex from '@stylexjs/stylex';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { z } from 'zod';

import { button_styles } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { text_input_styles } from '@/components/text-input';
import { orpc } from '@/lib/orpc';

export const Route = createFileRoute('/accounts/sign-up')({
	component: SignUpPage,
});

const routeApi = getRouteApi('/accounts/sign-up');

function SignUpPage() {
	const navigate = routeApi.useNavigate();
	const create = useMutation(orpc.users.create.mutationOptions());

	const { Field, Subscribe, handleSubmit } = useForm({
		defaultValues: {
			first_name: '',
			last_name: '',
			email: '',
			password: '',
		},
		onSubmit: async ({ value }) => {
			await create.mutateAsync(value);
			await navigate({ to: '/accounts/sign-in' });
		},
	});

	return (
		<div className="h-dvh overflow-auto" style={{ scrollbarGutter: 'stable' }}>
			<div className="flex min-h-dvh flex-col items-center bg-[oklch(96%_0_0)] p-8">
				<div className="w-100 rounded-xl bg-white p-8 shadow-sm ring-1 ring-[oklch(92%_0_0)]">
					<div className="text-xl font-bold">Create an account</div>
					<div className="mt-2 text-sm text-[oklch(56%_0_0)]">
						Welcome aboard! Just a few details to get started
					</div>
					<form
						className="mt-6 flex flex-col"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleSubmit();
						}}>
						<Field
							name="first_name"
							validators={{
								onChange: ({ value }) => {
									const { success, error } = schema.shape.first_name.safeParse(value);
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
											First Name
										</label>
										<input
											name={field.name}
											id={field.name}
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
							name="last_name"
							validators={{
								onChange: ({ value }) => {
									const { success, error } = schema.shape.last_name.safeParse(value);
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
											Last Name
										</label>
										<input
											name={field.name}
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(e.target.value)}
											{...stylex.props(text_input_styles.base)}
										/>
										{!!error && (
											<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
												{field.state.meta.errors[0]?.message}
											</div>
										)}
									</>
								);
							}}
						</Field>
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
											className={clsx('mt-6 text-sm font-medium', { 'text-red-600': error })}
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
												{field.state.meta.errors[0]?.message}
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
												{field.state.meta.errors[0]?.message}
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
										{...stylex.props(button_styles.base, styles.sign_up_button)}>
										{isSubmitting ? <Spinner className="size-5 animate-spin" /> : 'Sign Up'}
									</button>
								);
							}}
						</Subscribe>
					</form>
					<div className="mt-6 text-center text-sm">
						Already have an account?
						{' '}
						<Link className="underline underline-offset-2" to="/accounts/sign-in">
							Sign in
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

const styles = stylex.create({
	sign_up_button: {
		marginTop: 24,
	},
});

const schema = z.object({
	first_name: z.string().nonempty('We\'d love to call you something besides "Hey!"'),
	last_name: z.string().nonempty('A last name would be the cherry on top!'),
	email: z.email("This doesn't look like a valid email address"),
	password: z
	.string()
	.min(8, 'Passwords must have at least 8 characters')
	.max(72, "Passwords can't be longer than 72 characters")
	.regex(/^[ -~]+$/, 'Passwords must contain only printable ASCII characters'),
});
