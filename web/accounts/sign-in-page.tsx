/* eslint-disable import-x/no-extraneous-dependencies */
import * as stylex from '@stylexjs/stylex';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import cookies from 'js-cookie';
import { RiAppleFill, RiGoogleFill, RiMetaFill } from 'react-icons/ri';

import { button_styles } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { text_input_styles } from '@/components/text-input';
import { orpc } from '@/lib/orpc';
import { create_token_request } from '@/server/users/user-schema';

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

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
		validationLogic: revalidateLogic({
			mode: 'blur',
			modeAfterSubmission: 'change',
		}),
		validators: {
			onDynamic: create_token_request,
		},
		onSubmit: async ({ value }) => {
			await createToken.mutateAsync(value);
		},
	});

	return (
		<div className="flex h-dvh flex-col items-center overflow-auto bg-[oklch(96%_0_0)]" style={{ scrollbarGutter: 'stable' }}>
			<div className="m-8 w-100 rounded-xl bg-white p-8 shadow-sm ring-1 ring-[oklch(92%_0_0)]">
				<div sx={styles.title}>Sign in to your account</div>
				<div sx={styles.subtitle}>Enter your email and pick up where you left off</div>
				<form
					className="flex flex-col"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}>
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
								<button sx={[button_styles.base, styles.sign_in_button]} type="submit">
									{isSubmitting ? <Spinner className="size-5 animate-spin" /> : 'Sign In'}
								</button>
							);
						}}
					</form.Subscribe>
				</form>
				<div className="relative mt-6 text-center">
					<div className="absolute inset-x-0 top-[50%] border-t border-[oklch(92%_0_0)]" />
					<span className="relative bg-white px-2 text-sm text-[oklch(56%_0_0)]">
						Or continue with
					</span>
				</div>
				<div sx={styles.sso_button_group}>
					<button sx={styles.sso_button} type="button">
						<RiAppleFill {...stylex.props(styles.sso_button_icon)} />
					</button>
					<button sx={styles.sso_button} type="button">
						<RiGoogleFill {...stylex.props(styles.sso_button_icon)} />
					</button>
					<button sx={styles.sso_button} type="button">
						<RiMetaFill {...stylex.props(styles.sso_button_icon)} />
					</button>
				</div>
				<div sx={styles.signup_text}>
					Do not have an account?
					{' '}
					<Link to="/accounts/sign-up" {...stylex.props(styles.signup_link)}>
						Sign up
					</Link>
				</div>
			</div>
		</div>
	);
}

const styles = stylex.create({
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
	input_label: {
		marginTop: 24,
		fontSize: '0.875rem',
		fontWeight: 500,
		lineHeight: 1.25 / 0.875,
	},
	input_label_error: {
		color: 'oklch(57.7% 0.245 27.325)',
	},
	input_error_text: {
		marginTop: 8,
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: 'oklch(57.7% 0.245 27.325)',
	},
	sign_in_button: {
		marginTop: 24,
	},
	sso_button_group: {
		display: 'flex',
		gap: 16,
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
	sso_button_icon: {
		fontSize: '1rem',
		lineHeight: 1,
	},
	signup_text: {
		marginTop: 24,
		fontSize: 14,
		lineHeight: 1.25 / 0.875,
		textAlign: 'center',
	},
	signup_link: {
		textDecorationLine: 'underline',
		textUnderlineOffset: '2px',
	},
});
