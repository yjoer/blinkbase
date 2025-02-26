import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import type { router } from '@/server/_app/router';
import type { RouterClient } from '@orpc/server';

const get_orpc_client = createIsomorphicFn()
.client((): RouterClient<typeof router> => {
	const link = new RPCLink({
		url: 'http://localhost:3100/rpc',
		fetch: (request, init) => {
			return globalThis.fetch(request, {
				...init,
				credentials: 'include',
			});
		},
	});

	return createORPCClient(link);
})
.server((): RouterClient<typeof router> => {
	const link = new RPCLink({
		url: 'http://localhost:3100/rpc',
		headers: () => getRequestHeaders(),
	});

	return createORPCClient(link);
});

export const client: RouterClient<typeof router> = get_orpc_client();
export const orpc = createTanstackQueryUtils(client);
