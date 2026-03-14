// oxlint-disable import/no-default-export
import { oxlint_config } from '@xcamp/config/b/oxlint.js';
import { defineConfig, loadEnv } from 'vite-plus';

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	lint: {
		extends: [oxlint_config],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	test: {
		projects: [{
			extends: true,
			test: {
				includeSource: ['server/**/*.ts'],
				env: loadEnv('', 'server', ''),
			},
		}],
		coverage: {
			enabled: true,
			include: ['server/**/*.ts'],
			reportsDirectory: 'node_modules/.vitest/coverage',
		},
	},
});
