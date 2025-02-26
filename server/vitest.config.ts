// oxlint-disable import/no-default-export
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		includeSource: ['lib/**/*.{js,ts}', 'mods/**/*.{js,ts}'],
		coverage: {
			enabled: true,
			include: ['lib/**/*.{js,ts}', 'mods/**/*.{js,ts}'],
			reportsDirectory: 'node_modules/.vitest/coverage',
		},
		setupFiles: ['dotenv/config'],
	},
});
