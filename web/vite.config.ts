// oxlint-disable import/no-default-export
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { index, rootRoute, route } from '@tanstack/virtual-file-routes';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export const babelConfig = {
	plugins: [
		['@stylexjs/babel-plugin', {
			debug: process.env.NODE_ENV === 'development',
			unstable_moduleResolution: { type: 'commonJS' },
		}],
	],
	presets: [reactCompilerPreset()],
	parserOpts: {
		plugins: ['jsx', 'typescript'],
	},
} satisfies Parameters<typeof babel>[0];

export const routes = rootRoute('root.tsx', [
	route('/accounts', [
		route('/sign-in', '../accounts/sign-in-page.tsx'),
		route('/sign-up', '../accounts/sign-up-page.tsx'),
	]),
	route('/library', [
		index('../library/library-page.tsx'),
		route('/reader', '../library/reader-page.tsx'),
	]),
]);

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
	},
	plugins: [
		tanstackStart({
			srcDirectory: '_app',
			router: {
				virtualRouteConfig: routes,
				routesDirectory: '.',
			},
		}),
		nitro(),
		react(),
		babel(babelConfig),
		tailwindcss(),
	],
});
