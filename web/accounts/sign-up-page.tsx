/* eslint-disable import-x/no-extraneous-dependencies */
import * as stylex from '@stylexjs/stylex';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';

import { button_styles } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { text_input_styles } from '@/components/text-input';
import { orpc } from '@/lib/orpc';
import { create_user_request } from '@/server/users/user-schema';

export const Route = createFileRoute('/accounts/sign-up')({
	component: SignUpPage,
});

const routeApi = getRouteApi('/accounts/sign-up');

function SignUpPage() {
	const navigate = routeApi.useNavigate();
	const create = useMutation(orpc.users.create_user.mutationOptions());

	const form = useForm({
		defaultValues: {
			first_name: '',
			last_name: '',
			email: '',
			password: '',
		},
		validationLogic: revalidateLogic({
			mode: 'blur',
			modeAfterSubmission: 'change',
		}),
		validators: {
			onDynamic: create_user_request,
		},
		onSubmit: async ({ value }) => {
			await create.mutateAsync(value);
			await navigate({ to: '/accounts/sign-in' });
		},
	});

	return (
		<div className="h-dvh overflow-auto bg-[oklch(96%_0_0)] p-8" style={{ scrollbarGutter: 'stable' }}>
			<div className="mx-auto w-100 rounded-xl bg-white p-8 shadow-sm ring-1 ring-[oklch(92%_0_0)]">
				<div className="text-xl font-bold">Create an account</div>
				<div className="mt-2 text-sm text-[oklch(56%_0_0)]">
					Welcome aboard! Just a few details to get started
				</div>
				<form
					className="flex flex-col"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}>
					<form.Field name="first_name">
						{(field) => {
							const { errors, isTouched, isValid } = field.state.meta;

							return (
								<>
									<label htmlFor={field.name} sx={[styles.input_label, isTouched && !isValid && styles.input_label_error]}>
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
									{!!isTouched && !isValid && (
										<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
											{errors[0]?.message}
										</div>
									)}
								</>
							);
						}}
					</form.Field>
					<form.Field name="last_name">
						{(field) => {
							const { errors, isTouched, isValid } = field.state.meta;

							return (
								<>
									<label htmlFor={field.name} sx={[styles.input_label, isTouched && !isValid && styles.input_label_error]}>
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
									{!!isTouched && !isValid && (
										<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
											{errors[0]?.message}
										</div>
									)}
								</>
							);
						}}
					</form.Field>
					<form.Field name="email">
						{(field) => {
							const { errors, isTouched, isValid } = field.state.meta;

							return (
								<>
									<label htmlFor={field.name} sx={[styles.input_label, isTouched && !isValid && styles.input_label_error]}>
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
									{!!isTouched && !isValid && (
										<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
											{errors[0]?.message}
										</div>
									)}
								</>
							);
						}}
					</form.Field>
					<form.Field name="password">
						{(field) => {
							const { errors, isTouched, isValid } = field.state.meta;

							return (
								<>
									<label htmlFor={field.name} sx={[styles.input_label, isTouched && !isValid && styles.input_label_error]}>
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
									{!!isTouched && !isValid && (
										<div className="mt-2 text-[0.8125rem] font-medium text-red-600">
											{errors[0]?.message}
										</div>
									)}
								</>
							);
						}}
					</form.Field>
					<form.Subscribe selector={state => state.isSubmitting}>
						{(isSubmitting) => {
							return (
								<button sx={[button_styles.base, styles.sign_up_button]} type="submit">
									{isSubmitting ? <Spinner className="size-5 animate-spin" /> : 'Sign Up'}
								</button>
							);
						}}
					</form.Subscribe>
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
	);
}

const styles = stylex.create({
	input_label: {
		marginTop: 24,
		fontSize: 14,
		fontWeight: 500,
		lineHeight: 1.25 / 0.875,
	},
	input_label_error: {
		color: 'oklch(57.7% 0.245 27.325)',
	},
	sign_up_button: {
		marginTop: 24,
	},
});
