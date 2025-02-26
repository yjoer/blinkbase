// oxlint-disable no-console
// oxlint-disable no-process-exit
import { createServer } from 'node:http';

import { RPCHandler } from '@orpc/server/node';
import { CORSPlugin, RequestHeadersPlugin } from '@orpc/server/plugins';

import 'dotenv/config';
import { router } from './router';

const handler = new RPCHandler(router, {
	plugins: [
		new CORSPlugin({
			credentials: true,
		}),
		new RequestHeadersPlugin(),
	],
});

const server = createServer((req, res) => {
	void handler.handle(req, res, { prefix: '/rpc', context: {} }).then(({ matched }) => {
		if (matched) return;
		res.statusCode = 404;
		res.end('Not Found');
	});
});

server.listen(3100, () => {
	console.log('server listening on port 3100');
});

if (import.meta.webpackHot) {
	import.meta.webpackHot.accept();
	import.meta.webpackHot.dispose(() => server.close());

	import.meta.webpackHot.addStatusHandler((status) => {
		if (status === 'fail') process.exit();
	});
}
