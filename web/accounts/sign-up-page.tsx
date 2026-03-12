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
		<div sx={styles.page}>
			<div className="mx-auto w-100 rounded-xl bg-white p-8 shadow-sm ring-1 ring-[oklch(92%_0_0)]">
				<div sx={styles.title}>Create an account</div>
				<div sx={styles.subtitle}>Welcome aboard! Just a few details to get started</div>
				<form
					sx={styles.form}
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
										sx={text_input_styles.base}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={e => field.handleChange(e.target.value)}
									/>
									{!!isTouched && !isValid && (
										<div sx={styles.input_error_text}>
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
										sx={text_input_styles.base}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={e => field.handleChange(e.target.value)}
									/>
									{!!isTouched && !isValid && (
										<div sx={styles.input_error_text}>
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
										sx={text_input_styles.base}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={e => field.handleChange(e.target.value)}
									/>
									{!!isTouched && !isValid && (
										<div sx={styles.input_error_text}>
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
										sx={text_input_styles.base}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={e => field.handleChange(e.target.value)}
									/>
									{!!isTouched && !isValid && (
										<div sx={styles.input_error_text}>
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
				<div sx={styles.sign_in_text}>
					Already have an account?
					{' '}
					<Link to="/accounts/sign-in" {...stylex.props(styles.sign_in_link)}>
						Sign in
					</Link>
				</div>
			</div>
		</div>
	);
}

const styles = stylex.create({
	page: {
		height: '100dvh',
		padding: 32,
		overflow: 'auto',
		scrollbarGutter: 'stable',
		backgroundColor: 'oklch(96% 0 0)',
	},
	title: {
		fontSize: '1.25rem',
		fontWeight: 700,
		lineHeight: 1.75 / 1.25,
	},
	subtitle: {
		marginTop: 8,
		fontSize: '0.875rem',
		lineHeight: 1.25 / 0.875,
		color: 'oklch(56% 0 0)',
	},
	form: {
		display: 'flex',
		flexDirection: 'column',
	},
	input_label: {
		marginTop: 24,
		fontSize: 14,
		fontWeight: 500,
		lineHeight: 1.25 / 0.875,
	},
	input_label_error: {
		color: 'oklch(57.7% 0.245 27.325)',
	},
	input_error_text: {
		marginTop: 8,
		fontSize: '0.8125rem',
		color: 'oklch(57.7% 0.245 27.325)',
	},
	sign_up_button: {
		marginTop: 24,
	},
	sign_in_text: {
		marginTop: 24,
		fontSize: 14,
		lineHeight: 1.25 / 0.875,
		textAlign: 'center',
	},
	sign_in_link: {
		textDecorationLine: 'underline',
		textUnderlineOffset: '2px',
	},
});
