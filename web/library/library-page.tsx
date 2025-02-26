import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const CollectionsPane = lazy(() => import('./-collections-pane').then(mod => ({ default: mod.CollectionsPane })));
const ItemsMasonry = lazy(() => import('./-items-masonry').then(mod => ({ default: mod.ItemsMasonry })));

export const Route = createFileRoute('/library/')({
	component: LibraryPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			cat: search.cat as string,
		};
	},
});

function LibraryPage() {
	return (
		<div className="flex">
			<Suspense fallback={<div>Loading...</div>}>
				<CollectionsPane />
			</Suspense>
			<Suspense fallback={<div>Loading...</div>}>
				<ItemsMasonry />
			</Suspense>
		</div>
	);
}
