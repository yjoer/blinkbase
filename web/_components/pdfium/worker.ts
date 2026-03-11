import { init } from '@embedpdf/pdfium';
import wasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { ORPCError, os, type } from '@orpc/server';
import { RPCHandler } from '@orpc/server/message-port';

import type { WrappedPdfiumModule } from '@embedpdf/pdfium';
import type { SupportedMessagePort } from '@orpc/client/message-port';

const base = os.$context<PDFiumContext>();

const create_pdfium = base.handler(async ({ context }) => {
	context.pdfium = await init({ locateFile: () => wasm });
	context.pdfium.PDFiumExt_Init();
});

const load_file = base.input(type<{ url: string }>()).handler(async ({ context, input }) => {
	const response = await fetch(input.url);
	const buffer = await response.arrayBuffer();
	context.files.set(input.url, new Uint8Array(buffer));
});

const load_document = base.input(type<{ url: string }>()).handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	const buffer = context.files.get(input.url);
	if (!buffer) throw new ORPCError('file not loaded');

	const file_ptr = pdfium.pdfium.wasmExports.malloc(buffer.length);
	pdfium.pdfium.HEAPU8.set(buffer, file_ptr);

	const document_ptr = pdfium.FPDF_LoadMemDocument(file_ptr, buffer.length, '');
	if (!document_ptr) {
		const error = pdfium.FPDF_GetLastError();
		pdfium.pdfium.wasmExports.free(file_ptr);
		throw new ORPCError(`failed to load pdf: ${error}`);
	}

	return { file_ptr, document_ptr };
});

const close_document = base
.input(type<{ file_ptr: number; document_ptr: number }>())
.handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	pdfium.FPDF_CloseDocument(input.document_ptr);
	pdfium.pdfium.wasmExports.free(input.file_ptr);
});

const get_page_count = base
.input(type<{ document_ptr: number }>())
.handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	return pdfium.FPDF_GetPageCount(input.document_ptr);
});

const get_page_size = base
.input(type<{ document_ptr: number; page_index: number }>())
.handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	const size_ptr = pdfium.pdfium.wasmExports.malloc(8);
	const result = pdfium.FPDF_GetPageSizeByIndexF(input.document_ptr, input.page_index, size_ptr);
	if (!result) {
		pdfium.pdfium.wasmExports.free(size_ptr);
		throw new ORPCError('failed to get page size');
	}

	const width = pdfium.pdfium.getValue(size_ptr, 'float') as number;
	const height = pdfium.pdfium.getValue(size_ptr + 4, 'float') as number;
	pdfium.pdfium.wasmExports.free(size_ptr);

	return { width, height };
});

const get_page_sizes = base
.input(type<{ document_ptr: number; page_indexes: number[] }>())
.handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	const size_ptr = pdfium.pdfium.wasmExports.malloc(8);
	const sizes = [];

	for (const index of input.page_indexes) {
		const result = pdfium.FPDF_GetPageSizeByIndexF(input.document_ptr, index, size_ptr);
		if (!result) {
			pdfium.pdfium.wasmExports.free(size_ptr);
			throw new ORPCError(`failed to get page size for index ${index}`);
		}

		const width = pdfium.pdfium.getValue(size_ptr, 'float') as number;
		const height = pdfium.pdfium.getValue(size_ptr + 4, 'float') as number;
		sizes.push({ width, height });
	}

	pdfium.pdfium.wasmExports.free(size_ptr);
	return sizes;
});

const transfer_canvas = base
.input(type<{ url: string; page_index: number; canvas: OffscreenCanvas }>())
.handler(({ context, input }) => {
	let pages_map = context.canvases.get(input.url);
	if (!pages_map) {
		pages_map = new Map();
		context.canvases.set(input.url, pages_map);
	}

	pages_map.set(input.page_index, input.canvas);
});

const close_canvas = base
.input(type<{ url: string; page_index: number }>())
.handler(({ context, input }) => {
	const pages_map = context.canvases.get(input.url);
	pages_map?.delete(input.page_index);
});

const load_page = base
.input(type<{ document_ptr: number; page_index: number }>())
.handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	const page_ptr = pdfium.FPDF_LoadPage(input.document_ptr, input.page_index);
	if (!page_ptr) throw new ORPCError(`failed to load page ${input.page_index}`);

	return page_ptr;
});

const render_page = base
.input(
	type<{
		url: string;
		page_index: number;
		page_ptr: number;
		page_size: { width: number; height: number };
		scale: number;
		output_scale: number;
	}>(),
)
.handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	// const width = pdfium.FPDF_GetPageWidthF(input.page_ptr);
	// const height = pdfium.FPDF_GetPageHeightF(input.page_ptr);
	const { width, height } = input.page_size;
	const canvas_width = Math.floor(width * input.scale * input.output_scale);
	const canvas_height = Math.floor(height * input.scale * input.output_scale);

	const bitmap_ptr = pdfium.FPDFBitmap_Create(canvas_width, canvas_height, 0);
	if (!bitmap_ptr) {
		pdfium.FPDFBitmap_Destroy(bitmap_ptr);
		throw new ORPCError('failed to create bitmap');
	}

	const canvas = context.canvases.get(input.url)?.get(input.page_index);
	if (!canvas) {
		pdfium.FPDFBitmap_Destroy(bitmap_ptr);
		throw new ORPCError('canvas not transferred');
	}

	canvas.width = canvas_width;
	canvas.height = canvas_height;
	pdfium.FPDFBitmap_FillRect(bitmap_ptr, 0, 0, canvas_width, canvas_height, 0xFF_FF_FF_FF);

	pdfium.FPDF_RenderPageBitmap(
		bitmap_ptr,
		input.page_ptr,
		0,
		0,
		canvas_width,
		canvas_height,
		0,
		0x10,
	);

	const bitmap_buffer_ptr = pdfium.FPDFBitmap_GetBuffer(bitmap_ptr);
	if (!bitmap_buffer_ptr) {
		pdfium.FPDFBitmap_Destroy(bitmap_ptr);
		throw new ORPCError('failed to get bitmap buffer');
	}

	pdfium.FPDFBitmap_Destroy(bitmap_ptr);

	const bitmap_buffer_size = canvas_width * canvas_height * 4;
	const bitmap_buffer = new Uint8Array(
		pdfium.pdfium.HEAPU8.buffer,
		pdfium.pdfium.HEAPU8.byteOffset + bitmap_buffer_ptr,
		bitmap_buffer_size,
	).slice();

	const image_data = new ImageData(
		new Uint8ClampedArray(bitmap_buffer.buffer),
		canvas_width,
		canvas_height,
	);

	const ctx = canvas.getContext('2d')!;
	ctx.putImageData(image_data, 0, 0);
});

const close_page = base.input(type<{ page_ptr: number }>()).handler(({ context, input }) => {
	const { pdfium } = context;
	if (!pdfium) throw new ORPCError('pdfium not initialized');

	pdfium.FPDF_ClosePage(input.page_ptr);
});

export const router = {
	create_pdfium,
	load_file,
	load_document,
	close_document,
	get_page_count,
	get_page_size,
	get_page_sizes,
	transfer_canvas,
	close_canvas,
	load_page,
	render_page,
	close_page,
};

interface PDFiumContext {
	pdfium?: WrappedPdfiumModule;
	files: Map<string, Uint8Array>;
	canvases: Map<string, Map<number, OffscreenCanvas>>;
}

const handler = new RPCHandler<PDFiumContext>(router);

handler.upgrade(globalThis as unknown as SupportedMessagePort, {
	context: {
		files: new Map(),
		canvases: new Map(),
	},
});
