import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const PDFJSViewer = lazy(() => import('./reader/-pdfjs-viewer').then(mod => ({ default: mod.PDFJSViewer })));
const PDFiumViewer = lazy(() => import('./reader/-pdfium-viewer').then(mod => ({ default: mod.PDFiumViewer })));

const renderer: string = 'pdfium';

export const Route = createFileRoute('/library/reader')({
	component: ReaderPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			id: (search.id as string) || '',
		};
	},
});

function ReaderPage() {
	return (
		<Suspense>
			{renderer === 'pdfium' && <PDFiumViewer />}
			{renderer === 'pdfjs' && <PDFJSViewer />}
		</Suspense>
	);
}
