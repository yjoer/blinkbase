import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/message-port';
import { MessageType } from '@orpc/standard-server-peer';

import PDFiumWorker from '@/components/pdfium/worker?worker';

import type { router } from '@/components/pdfium/worker';
import type { RouterClient } from '@orpc/server';

export const transferables = new WeakSet<Transferable>();

export function create_pdfium_worker(): PDFiumWorker {
	const link = new RPCLink({
		port: new PDFiumWorker(),
		experimental_transfer: (message) => {
			const [_id, type, payload] = message;
			if (type !== MessageType.REQUEST) return [];

			const transfer: Transferable[] = [];
			const body = payload.body as { json: Record<string, any> } | undefined;
			for (const v of Object.values(body?.json ?? {})) {
				if (transferables.has(v as object)) transfer.push(v as Transferable);
			}

			return transfer;
		},
	});

	return createORPCClient(link);
}

export type PDFiumWorker = RouterClient<typeof router>;
