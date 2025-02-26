import { create } from 'zustand';

import type { PDFiumWorker } from './worker-utils';

export interface PDFiumState {
	scale: number;
	worker?: PDFiumWorker;
	set_scale: (scale: number) => void;
	set_worker: (worker: PDFiumWorker) => void;
}

export const usePDFiumStore = create<PDFiumState>(set => ({
	scale: 1,
	worker: undefined,
	set_scale: scale => set({ scale }),
	set_worker: worker => set({ worker }),
}));
