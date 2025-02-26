import { create } from 'zustand';

export interface PDFJSState {
	deferred_scale: number;
	scale: number;
	set_deferred_scale: (deferred_scale: number) => void;
	set_scale: (scale: number) => void;
}

export const usePDFJSStore = create<PDFJSState>(set => ({
	scale: 1,
	deferred_scale: 1,
	set_scale: (scale: number) => {
		set({ scale });
	},
	set_deferred_scale: (deferred_scale: number) => {
		set({ deferred_scale });
	},
}));
