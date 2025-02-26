import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react';

import { usePDFiumStore } from '@/components/pdfium/store';
import { handle_page_zoom, PT_TO_PX_RATIO } from '@/components/pdfium/utils';
import { create_pdfium_worker, transferables } from '@/components/pdfium/worker-utils';

import type { PDFiumWorker } from '@/components/pdfium/worker-utils';
import type { Virtualizer } from '@tanstack/react-virtual';

export function PDFiumViewer() {
	const scale = usePDFiumStore(state => state.scale);
	const set_worker = usePDFiumStore(state => state.set_worker);

	const [document_ptr, set_document_ptr] = useState<number>();
	const [url, set_url] = useState<string>();
	const [n_pages, set_n_pages] = useState(0);
	const [max_width, set_max_width] = useState(0);
	const [max_height, set_max_height] = useState(0);

	useEffect(() => {
		let worker: PDFiumWorker | undefined;
		let file_ptr: number | undefined;
		let document_ptr: number | undefined;

		const init = async () => {
			worker = create_pdfium_worker();
			await worker.create_pdfium();

			const url = `https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf`;
			await worker.load_file({ url });
			({ file_ptr, document_ptr } = await worker.load_document({ url }));
			const n_pages = await worker.get_page_count({ document_ptr });

			const sizes = await worker.get_page_sizes({ document_ptr, page_indexes: [0, 1, 2] });
			let max_width = 0;
			let max_height = 0;
			for (const p of sizes) {
				if (p.width > max_width) max_width = p.width;
				if (p.height > max_height) max_height = p.height;
			}

			set_worker(worker);
			set_url(url);
			set_document_ptr(document_ptr);
			set_n_pages(n_pages);
			set_max_width(max_width * PT_TO_PX_RATIO);
			set_max_height(max_height * PT_TO_PX_RATIO);
		};

		void init();

		const page_zoom_controller = handle_page_zoom({ state: usePDFiumStore.getState() });

		return () => {
			if (file_ptr && document_ptr) void worker?.close_document({ file_ptr, document_ptr });
			page_zoom_controller.abort();
		};
	}, [set_worker]);

	const scrollable_ref = useRef<HTMLDivElement>(null!);
	const virtualizer = useVirtualizer({
		count: n_pages,
		getScrollElement: () => scrollable_ref.current,
		estimateSize: () => max_height * scale,
		gap: 8,
		overscan: 1,
	});

	return (
		<div className="flex h-dvh bg-[oklch(96%_0_0)]">
			<div ref={scrollable_ref} className="h-full grow overflow-auto">
				<div
					className="relative mx-auto"
					style={{ width: max_width * scale, height: virtualizer.getTotalSize() }}>
					{virtualizer.getVirtualItems().map((item) => {
						return (
							<Page
								key={item.key}
								document_ptr={document_ptr}
								page_index={item.index}
								page_scale={scale}
								style={{ height: item.size, transform: `translateY(${item.start}px)` }}
								url={url}
								virtualizer={virtualizer}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}

interface PageHandle {
	render: (scale: number) => Promise<void>;
}

interface PageProps {
	document_ptr?: number;
	page_index: number;
	page_scale: number;
	ref?: React.RefObject<PageHandle>;
	style?: React.CSSProperties;
	url?: string;
	virtualizer: Virtualizer<HTMLDivElement, Element>;
}

function Page({ ref, virtualizer, url, document_ptr, page_index, page_scale, style }: PageProps) {
	const worker = usePDFiumStore(state => state.worker);

	const page_ptr_ref = useRef<number>(null);
	const page_size_ref = useRef<{ height: number; width: number }>(null);
	const page_ref = useRef<HTMLDivElement>(null!);
	const canvas_ref = useRef<HTMLCanvasElement>(null!);

	const resize = (scale: number = page_scale) => {
		if (!page_size_ref.current) return;

		const { width, height } = page_size_ref.current;
		canvas_ref.current.style.width = `${width * scale}px`;
		canvas_ref.current.style.height = `${height * scale}px`;
		virtualizer.resizeItem(page_index, height * scale);
	};

	const render = async (scale: number = page_scale) => {
		if (!worker || !url || !page_ptr_ref.current || !page_size_ref.current) return;

		const { width, height } = page_size_ref.current;
		await worker.render_page({
			url,
			page_index,
			page_ptr: page_ptr_ref.current,
			page_size: { width, height },
			scale,
			output_scale: window.devicePixelRatio || 1,
		});
	};

	useImperativeHandle(ref, () => {
		return {
			resize,
			render,
		};
	});

	const effect_resize = useEffectEvent(resize);
	const effect_render = useEffectEvent(render);

	useEffect(() => {
		if (!worker || !url || !document_ptr) return;

		canvas_ref.current = globalThis.document.createElement('canvas');
		canvas_ref.current.style.imageRendering = 'pixelated';
		page_ref.current.append(canvas_ref.current);
		const offscreen = canvas_ref.current.transferControlToOffscreen();

		const init = async () => {
			transferables.add(offscreen);
			await worker.transfer_canvas({ url, page_index, canvas: offscreen });

			page_ptr_ref.current = await worker.load_page({ document_ptr, page_index });

			const { width, height } = await worker.get_page_size({ document_ptr, page_index });
			page_size_ref.current = { width: width * PT_TO_PX_RATIO, height: height * PT_TO_PX_RATIO };

			effect_resize();
			await effect_render();
		};

		void init();

		return () => {
			if (page_ptr_ref.current) void worker.close_page({ page_ptr: page_ptr_ref.current });
			canvas_ref.current.remove();
			void worker.close_canvas({ url, page_index });
		};
	}, [worker, url, document_ptr, page_index]);

	useEffect(() => {
		effect_resize();
		void effect_render();
	}, [page_scale]);

	return <div ref={page_ref} className="absolute" style={style}></div>;
}
