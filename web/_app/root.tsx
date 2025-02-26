/// <reference types="vite/client" />
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';

import styles from './root.css?url';
import stylex from './stylex.css?url';

import type { RouterContext } from './router';

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: 'utf8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
		],
		links: [
			{ rel: 'stylesheet', href: styles },
			{ rel: 'stylesheet', href: stylex },
		],
	}),
	component: RootComponent,
	notFoundComponent: NotFound,
});

function RootComponent() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	);
}

function NotFound() {
	return <div>Not Found</div>;
}
