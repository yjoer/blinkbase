// oxlint-disable import/no-default-export
import { getServerConfig } from '@xcamp/webpack/rspack-config';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const config = getServerConfig({
	entry: ['./_app/server.ts'],
	mode,
	projectPath: import.meta.dirname,
	configPath: import.meta.filename,
});

export default config;
