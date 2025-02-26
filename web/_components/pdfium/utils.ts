import type { PDFiumState } from './store';
import type { WrappedPdfiumModule } from '@embedpdf/pdfium';

declare module '@embedpdf/pdfium' {
	interface PdfiumRuntimeMethods {
		HEAP8: Int8Array;
		HEAPU8: Uint8Array;
		HEAP16: Int16Array;
		HEAPU16: Uint16Array;
		HEAP32: Int32Array;
		HEAPU32: Uint32Array;
		HEAPF32: Float32Array;
		HEAPF64: Float64Array;
	}
}

export const PT_TO_PX_RATIO = 96 / 72;

interface LoadDocumentOptions {
	pdfium: WrappedPdfiumModule;
	buffer: Uint8Array;
}

export function load_document({ pdfium, buffer }: LoadDocumentOptions) {
	const file_ptr = pdfium.pdfium.wasmExports.malloc(buffer.length);
	pdfium.pdfium.HEAPU8.set(buffer, file_ptr);

	const document_ptr = pdfium.FPDF_LoadMemDocument(file_ptr, buffer.length, '');
	if (!document_ptr) {
		const error = pdfium.FPDF_GetLastError();
		pdfium.pdfium.wasmExports.free(file_ptr);
		throw new Error(`Failed to load PDF: ${error}`);
	}

	return { file_ptr, document_ptr };
}

interface HandlePageZoomOptions {
	state: PDFiumState;
}

export function handle_page_zoom({ state }: HandlePageZoomOptions) {
	let scale = state.scale;
	const { set_scale } = state;

	const controller = new AbortController();

	const listener = (event: WheelEvent) => {
		if (!event.ctrlKey) return;
		event.preventDefault();

		const delta = Math.sign(event.deltaY) * -0.1;
		const new_scale = scale + delta;
		if (new_scale < 0.1 || new_scale > 10) return;

		scale = new_scale;
		set_scale(new_scale);
	};

	globalThis.addEventListener('wheel', listener, { passive: false, signal: controller.signal });

	return controller;
}
