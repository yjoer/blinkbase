import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';

import { usePDFJSStore } from '@/components/pdf-js/store';
import { render_text_layer, TextLayer } from '@/components/pdf-js/text-layer';
import {
	create_pdf_worker,
	handle_page_zoom,
	load_document,
	load_page,
	PT_TO_PX_RATIO,
	render_page,
} from '@/components/pdf-js/utils';

import type { Virtualizer } from '@tanstack/react-virtual';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextContent } from 'pdfjs-dist/types/src/display/api';

export function PDFJSViewer() {
	const [document, set_document] = useState<PDFDocumentProxy>();
	const [heights, set_heights] = useState<number[]>([]);
	const [max_width, set_max_width] = useState<number>();

	useEffect(() => {
		const worker = create_pdf_worker();

		void load_document({
			url: `https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf`,
			worker,
		}).then(({ document, heights, max_width }) => {
			set_document(document);
			set_heights(heights);
			set_max_width(max_width);
		});

		const page_zoom_controller = handle_page_zoom({
			state: usePDFJSStore.getState(),
			container: scrollable_ref.current,
		});

		return () => {
			page_zoom_controller.abort();
			worker.destroy();
		};
	}, []);

	const scrollable_ref = useRef<HTMLDivElement>(null!);
	const text_layer = useRef(new TextLayer());
	const scale = usePDFJSStore(state => state.scale);

	const virtualizer = useVirtualizer({
		count: heights.length,
		getScrollElement: () => scrollable_ref.current,
		estimateSize: index => heights[index] * scale * PT_TO_PX_RATIO,
		enabled: !!document,
		gap: 8,
		overscan: 1,
	});

	return (
		<div className="flex h-dvh bg-[oklch(92%_0_0)]">
			<div className="h-full w-0 shrink-0 bg-[oklch(96%_0_0)]" />
			<div ref={scrollable_ref} className="h-full grow overflow-auto">
				<div
					className="relative mx-auto"
					style={{
						height: virtualizer.getTotalSize(),
						width: (max_width ?? 0) * scale * PT_TO_PX_RATIO,
					}}>
					{virtualizer.getVirtualItems().map((item) => {
						return (
							<Page
								key={item.key}
								document={document}
								page_number={item.index + 1}
								style={{
									height: item.size,
									transform: `translateY(${item.start}px)`,
								}}
								text_layer={text_layer}
								virtualizer={virtualizer}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
	document?: PDFDocumentProxy;
	page_number: number;
	text_layer: React.RefObject<TextLayer>;
	virtualizer: Virtualizer<HTMLDivElement, Element>;
}

function Page({ virtualizer, document, page_number, text_layer, ...props }: PageProps) {
	const [page, set_page] = useState<PDFPageProxy>();
	const [text_content, set_text_content] = useState<TextContent>();

	const canvas = useRef<HTMLCanvasElement>(null!);
	const text_group = useRef<HTMLDivElement>(null!);
	const first_update = useRef(true);

	const scale = usePDFJSStore(state => state.scale);
	const deferred_scale = usePDFJSStore(state => state.deferred_scale);

	useEffect(() => {
		if (!document) return;

		let current_page: PDFPageProxy | undefined;
		void load_page(document, page_number).then(({ page, text_content }) => {
			current_page = page;
			set_page(page);
			set_text_content(text_content);
		});

		return () => {
			current_page?.cleanup();
		};
	}, [document, page_number]);

	useEffect(() => {
		if (!page) return;

		const viewport = page.getViewport({ scale: scale * PT_TO_PX_RATIO });
		canvas.current.style.width = `${Math.floor(viewport.width)}px`;
		canvas.current.style.height = `${Math.floor(viewport.height)}px`;
		text_group.current.style.width = `${Math.floor(viewport.width)}px`;
		text_group.current.style.height = `${Math.floor(viewport.height)}px`;

		// measure the heights after scaling changes
		if (first_update.current) first_update.current = false;
		else virtualizer.measure();
	}, [virtualizer, page, scale]);

	useEffect(() => {
		if (!page) return;
		const render_task = render_page({ page, canvas: canvas.current, scale: deferred_scale });

		return () => {
			render_task.cancel();
		};
	}, [page, deferred_scale]);

	useEffect(() => {
		if (!page || !text_content) return;

		render_text_layer({
			page,
			text_group: text_group.current,
			text_content,
			text_layer: text_layer.current,
			deferred_scale,
		});
	}, [page, text_content, text_layer, deferred_scale]);

	return (
		<div className="absolute" {...props}>
			<canvas ref={canvas} className="rendering-[pixelated]" />
			<div ref={text_group} className="absolute top-0 left-0 selection:bg-[rgba(0_0_255/0.25)]" />
		</div>
	);
}
