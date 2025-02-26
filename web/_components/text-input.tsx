import * as stylex from '@stylexjs/stylex';

import { tokens } from '../_app/tokens.stylex';

export const text_input_styles = stylex.create({
	base: {
		paddingBlock: 8,
		paddingInline: 12,
		marginTop: 8,
		fontSize: {
			default: '1rem',
			'@media (width >= 768px)': '0.875rem',
		},
		lineHeight: {
			default: 1.5,
			'@media (width >= 768px)': 1.25 / 0.875,
		},
		outline: {
			':focus-visible': 'none',
		},
		borderRadius: 6,
		boxShadow: {
			default: `0 0 0 1px oklch(92% 0 0), ${tokens.shadow_sm}`,
			':focus-visible': `0 0 0 1px oklch(72% 0 0 / 60%), ${tokens.shadow_sm}`,
		},
		'::placeholder': {
			color: 'oklch(56% 0 0)',
		},
	},
});
