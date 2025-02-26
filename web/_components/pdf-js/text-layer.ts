import { Util } from 'pdfjs-dist';

import { PT_TO_PX_RATIO } from './utils';

import type {
	PDFPageProxy,
	TextContent,
	TextItem,
	TextStyle,
} from 'pdfjs-dist/types/src/display/api';

export class TextLayer {
	canvas_contexts: Map<string, CanvasRenderingContext2D>;
	canvas_contexts_fonts: WeakMap<CanvasRenderingContext2D, { family: string; size: number }>;
	ascents: Map<string, number>;

	constructor() {
		this.canvas_contexts = new Map();
		this.canvas_contexts_fonts = new WeakMap();
		this.ascents = new Map();
	}

	get_or_create_canvas(lang?: string) {
		const cached_ctx = this.canvas_contexts.get((lang ||= ''));
		if (cached_ctx) return cached_ctx;

		const canvas = document.createElement('canvas');
		canvas.lang = lang;
		document.body.append(canvas);

		const ctx = canvas.getContext('2d', {
			alpha: false,
			willReadFrequently: true,
		});

		if (!ctx) return;

		this.canvas_contexts.set(lang, ctx);
		this.canvas_contexts_fonts.set(ctx, { size: 0, family: '' });
		return ctx;
	}

	ensure_context_font(ctx: CanvasRenderingContext2D, family: string, size: number) {
		const fonts = this.canvas_contexts_fonts.get(ctx)!;

		if (fonts.size === size && fonts.family === family) return;

		ctx.font = `${size}px ${family}`;
		fonts.size = size;
		fonts.family = family;
	}

	get_ascent(family: string, style: TextStyle, lang: string) {
		const cached_ascent = this.ascents.get(family);
		if (cached_ascent) return cached_ascent;

		let ratio = 0.8;
		const ctx = this.get_or_create_canvas(lang);
		if (!ctx) return ratio;

		ctx.canvas.width = 30;
		ctx.canvas.height = 30;
		this.ensure_context_font(ctx, family, 30);

		const metrics = ctx.measureText('');
		const ascent = metrics.fontBoundingBoxAscent;
		const descent = Math.abs(metrics.fontBoundingBoxDescent);

		ctx.canvas.width = 0;
		ctx.canvas.height = 0;

		if (ascent) {
			ratio = ascent / (ascent + descent);
		} else if (style.ascent) {
			ratio = style.ascent;
		} else if (style.descent) {
			ratio = 1 + style.descent;
		}

		this.ascents.set(family, ratio);
		return ratio;
	}

	get_alignment_x({ lang, canvas_width, text, family, size, scale }: GetAlignmentXParams) {
		if (canvas_width === 0 || text === '') return 1;

		const ctx = this.get_or_create_canvas(lang);
		if (!ctx) return 1;

		this.ensure_context_font(ctx, family, size * scale);
		const { width } = ctx.measureText(text);

		if (width > 0) {
			return (canvas_width * scale) / width;
		}

		return 1;
	}

	get_text_metrics(item: TextItem, style: TextStyle, transform: number[], scale: number) {
		// In PDF, the origin is at the bottom left corner. Convert the coordinates to HTML coordinates.
		const tx = Util.transform(transform, item.transform) as number[];

		const font_height = Math.hypot(tx[2], tx[3]);
		const font_size = font_height * scale * PT_TO_PX_RATIO;
		const font_ascent = this.get_ascent(style.fontFamily, style, '') * font_height;

		let angle = Math.atan2(tx[1], tx[0]);
		if (style.vertical) angle += Math.PI / 2;

		let left: number;
		let top: number;

		if (angle === 0) {
			left = tx[4];
			top = tx[5] - font_ascent;
		} else {
			left = tx[4] + font_ascent * Math.sin(angle);
			top = tx[5] - font_ascent * Math.cos(angle);
		}

		let scale_text = false;
		let canvas_width = 0;

		if (item.str.length > 1) {
			scale_text = true;
		} else if (item.str !== ' ' && item.transform[0] !== item.transform[3]) {
			const scale_x = Math.abs(item.transform[0] as number);
			const scale_y = Math.abs(item.transform[3] as number);
			const min_max_ratio = Math.max(scale_x, scale_y) / Math.min(scale_x, scale_y);

			if (scale_x !== scale_y && min_max_ratio > 1.5) scale_text = true;
		}

		if (scale_text) canvas_width = style.vertical ? item.height : item.width;

		const alignment_x = this.get_alignment_x({
			text: item.str,
			size: font_height,
			scale: scale * PT_TO_PX_RATIO * (window.devicePixelRatio || 1),
			family: style.fontFamily,
			lang: '',
			canvas_width,
		});

		let t = '';
		if (angle !== 0) t += `rotate(${angle}rad)`;
		if (alignment_x !== 1) t += `scaleX(${alignment_x})`;

		return { font_size, top, left, t };
	}
}

interface GetAlignmentXParams {
	canvas_width: number;
	family: string;
	lang: string;
	scale: number;
	size: number;
	text: string;
}

interface PageViewportRawDims {
	pageHeight: number;
	pageWidth: number;
	pageX: number;
	pageY: number;
}

interface RenderTextLayerOptions {
	deferred_scale: number;
	page: PDFPageProxy;
	text_content: TextContent;
	text_group: HTMLDivElement;
	text_layer: TextLayer;
}

export function render_text_layer({
	page,
	text_group,
	text_content,
	text_layer,
	deferred_scale,
}: RenderTextLayerOptions) {
	const viewport = page.getViewport({ scale: 1 });
	const {
		pageWidth: page_width,
		pageHeight: page_height,
		pageX: page_x,
		pageY: page_y,
	} = viewport.rawDims as PageViewportRawDims;
	const transform = [1, 0, 0, -1, -page_x, page_y + page_height];

	const document_fragment = globalThis.document.createDocumentFragment();
	for (let i = 0; i < text_content.items.length; i++) {
		const item = text_content.items[i] as TextItem;
		const style = text_content.styles[item.fontName];
		const { font_size, top, left, t } = text_layer.get_text_metrics(
			item,
			style,
			transform,
			deferred_scale,
		);

		if (text_group.childNodes.length > 0) {
			const text_span = text_group.children[i] as HTMLSpanElement;
			text_span.style.fontSize = `${font_size}px`;
			text_span.style.transform = t;
			continue;
		}

		const text_span = globalThis.document.createElement('span');
		text_span.textContent = item.str;
		text_span.style.position = 'absolute';
		text_span.style.top = `${(top / page_height) * 100}%`;
		text_span.style.left = `${(left / page_width) * 100}%`;
		text_span.style.color = 'transparent';
		text_span.style.fontFamily = style.fontFamily;
		text_span.style.fontSize = `${font_size}px`;
		text_span.style.lineHeight = '1';
		text_span.style.whiteSpace = 'pre';
		text_span.style.transform = t;
		text_span.style.transformOrigin = '0 0';
		document_fragment.append(text_span);
	}

	if (text_group.childNodes.length === 0) {
		text_group.append(document_fragment);
	}
}
