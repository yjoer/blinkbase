import { debounce } from 'es-toolkit';
import { getDocument, PDFWorker } from 'pdfjs-dist';

import type { PDFJSState } from './store';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

export const PT_TO_PX_RATIO = 96 / 72;

export function create_pdf_worker() {
	// https://github.com/mozilla/pdf.js/blob/v4.10.38/src/display/api.js#L362-L373
	// https://github.com/mozilla/pdf.js/blob/v5.4.149/src/display/api.js#L392-L400
	const worker = PDFWorker.create({
		port: new Worker(new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url), {
			type: 'module',
		}),
	});

	return worker;
}

interface LoadDocumentOptions extends DocumentInitParameters {}

export async function load_document({ url, worker }: LoadDocumentOptions) {
	const loading_task = getDocument({ url, worker });
	const document = await loading_task.promise;

	// replace this with precomputed heights on the server.
	const promises: Promise<PDFPageProxy>[] = [];
	for (let i = 1; i <= document.numPages; i++) promises.push(document.getPage(i));

	const pages = await Promise.all(promises);
	const heights = pages.map(page => page.getViewport({ scale: 1 }).height);
	const widths = pages.map(page => page.getViewport({ scale: 1 }).width);
	const max_width = Math.max(...widths);

	return { document, heights, max_width };
}

export async function load_page(document: PDFDocumentProxy, page_number: number) {
	const page = await document.getPage(page_number);
	const text_content = await page.getTextContent();

	return { page, text_content };
}

interface RenderPageOptions {
	canvas: HTMLCanvasElement;
	page: PDFPageProxy;
	scale: number;
}

export function render_page({ page, canvas, scale }: RenderPageOptions) {
	const viewport = page.getViewport({ scale: scale * PT_TO_PX_RATIO });
	const output_scale = window.devicePixelRatio || 1;

	canvas.width = Math.floor(viewport.width * output_scale);
	canvas.height = Math.floor(viewport.height * output_scale);

	/*
	 * [a c e] [x]   [ax + cy + e]
	 * [b d f] [y] = [bx + dy + f]
	 * [0 0 1] [1]   [1]
	 *
	 * a - x scale, b - y skew, c - x skew
	 * d - y scale, e - x translation, f - y translation
	 */
	const transform = output_scale === 1 ? undefined : [output_scale, 0, 0, output_scale, 0, 0];

	return page.render({
		canvas,
		viewport,
		transform,
	});
}

interface HandlePageZoomOptions {
	container: HTMLDivElement;
	state: PDFJSState;
}

export function handle_page_zoom({ state, container }: HandlePageZoomOptions) {
	let scale = state.scale;
	const { set_scale, set_deferred_scale } = state;

	const controller = new AbortController();
	const set_scale_debounced = debounce(set_deferred_scale, 100, { signal: controller.signal });

	const listener = (event: WheelEvent) => {
		if (!event.ctrlKey) return;
		event.preventDefault();

		const delta = Math.sign(event.deltaY) * -0.1;
		const new_scale = scale + delta;
		if (new_scale < 0.1 || new_scale > 10) return;

		// the cursor position relative to the container
		const cursor_x = event.clientX - container.offsetLeft;
		const cursor_y = event.clientY - container.offsetTop;

		// the absolute position of the cursor within the container
		const point_x = container.scrollLeft + cursor_x;
		const point_y = container.scrollTop + cursor_y;

		// the absolute position of the cursor according to the scale factor
		const scale_factor = new_scale / scale;
		const point_x_scaled = point_x * scale_factor;
		const point_y_scaled = point_y * scale_factor;

		// new scroll positions that keep the point under the cursor at the same
		// visual position after scaling
		const scroll_left_scaled = point_x_scaled - cursor_x;
		const scroll_top_scaled = point_y_scaled - cursor_y;
		container.scrollLeft = scroll_left_scaled;
		container.scrollTop = scroll_top_scaled;

		scale = new_scale;
		set_scale(new_scale);
		set_scale_debounced(new_scale);
	};

	globalThis.addEventListener('wheel', listener, { passive: false, signal: controller.signal });

	return controller;
}
