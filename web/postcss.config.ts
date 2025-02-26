// oxlint-disable import/no-default-export
import stylex from '@stylexjs/postcss-plugin';
import autoprefixer from 'autoprefixer';

// @ts-expect-error ext
import { babelConfig } from './vite.config.ts';

import type { Config } from 'postcss-load-config';

const config = {
	plugins: [
		stylex({
			include: [
				'_app/**/*.{ts,tsx}',
				'_components/**/*.{ts,tsx}',
				'accounts/**/*.{ts,tsx}',
				'library/**/*.{ts,tsx}',
			],
			useCSSLayers: true,
			babelConfig: {
				plugins: babelConfig.plugins.filter(p => p[0].startsWith('@stylexjs')),
				parserOpts: babelConfig.parserOpts,
			},
		}),
		autoprefixer(),
	],
} satisfies Config;

export default config;
