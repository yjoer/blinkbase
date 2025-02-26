import * as stylex from '@stylexjs/stylex';

import { tokens } from '../_app/tokens.stylex';

export const button_styles = stylex.create({
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		paddingBlock: 8,
		paddingInline: 16,
		fontSize: '0.875rem',
		fontWeight: 500,
		lineHeight: 1.25 / 0.875,
		color: 'oklch(96% 0 0)',
		cursor: 'pointer',
		backgroundColor: {
			default: 'oklch(24% 0 0)',
			':hover': 'oklch(24% 0 0 / 90%)',
		},
		borderRadius: 6,
		boxShadow: tokens.shadow_sm,
	},
});
