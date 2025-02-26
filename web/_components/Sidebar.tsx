import * as stylex from '@stylexjs/stylex';
import React from 'react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
	return <div {...stylex.props(styles.base)}>{children}</div>;
}

const styles = stylex.create({
	base: {
		display: 'flex',
		flexDirection: 'column',
		width: 300,
		height: '100dvh',
		backgroundColor: 'oklch(98% 0 0)',
		boxShadow: '1px 0 0 0 oklch(92% 0 0)',
	},
});

export const sidebar_menu_button_styles = stylex.create({
	base: {
		display: 'flex',
		gap: 8,
		alignItems: 'center',
		padding: 8,
		color: {
			default: 'oklch(32% 0 0)',
			':hover': 'oklch(4% 0 0)',
		},
		cursor: 'pointer',
		outline: 'none',
		backgroundColor: {
			':hover': 'oklch(96% 0 0)',
		},
		borderRadius: 6,
	},
});
