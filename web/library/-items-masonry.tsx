import { useVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState } from 'react';

export function ItemsMasonry() {
	const scrollableRef = useRef<HTMLDivElement>(null!);
	const listRef = useRef<HTMLDivElement>(null!);
	const [listWidth, setListWidth] = useState(0);

	const [widths] = useState(
		Array.from({ length: 20 }, () => Math.floor(Math.random() * 200) + 150),
	);
	const [heights] = useState(
		Array.from({ length: 20 }, () => Math.floor(Math.random() * 200) + 150),
	);

	useLayoutEffect(() => {
		const { width } = listRef.current.getBoundingClientRect();
		setListWidth(width);
	}, []);

	const virtualizer = useVirtualizer({
		count: heights.length,
		getScrollElement: () => scrollableRef.current,
		estimateSize: (index) => {
			const lanes = 4;
			const gap = 8;
			const cellWidth = listWidth / 4 - ((lanes - 1) * gap) / lanes;

			const aspectRatio = heights[index] / widths[index];

			const margin = 6 + 2;
			const textHeight = 60; // 2 lines of text, sometimes 1 line + 1 line of author

			return cellWidth * aspectRatio + margin + textHeight;
		},
		enabled: listWidth !== 0,
		gap: 8,
		lanes: 4,
		overscan: 4,
	});

	return (
		<div
			ref={scrollableRef}
			className="h-dvh grow overflow-auto px-4"
			style={{ scrollbarGutter: 'stable' }}>
			<div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
				{virtualizer.getVirtualItems().map((item) => (
					<div
						key={item.key}
						className="absolute"
						style={{
							// left: `calc(${item.lane * 25}% + ${item.lane * 2}px)`,
							height: item.size,
							width: 'calc(25% - 6px)',
							transform: `translateX(${item.lane * 100}%) translateX(${item.lane * 8}px) translateY(${item.start}px)`,
						}}>
						<img
							alt="Sample"
							className="w-full"
							height={heights[item.index]}
							src={`https://placehold.co/${widths[item.index]}x${heights[item.index]}`}
							width={widths[item.index]}
						/>
						<div className="mt-1.5 line-clamp-2 leading-tight font-medium text-[oklch(24%_0_0)]">
							Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow
						</div>
						<div className="mt-0.5 truncate text-sm text-[oklch(64%_0_0)]">
							Aurélien Géron, Aurélien Géron, Aurélien Géron
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
