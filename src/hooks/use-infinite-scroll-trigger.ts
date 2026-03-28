import { useEffect, useState } from "react";

type UseInfiniteScrollTriggerOptions = {
	disabled?: boolean;
	hasNextPage?: boolean;
	isFetchingNextPage: boolean;
	onLoadMore: () => Promise<unknown> | unknown;
	rootMargin?: string;
};

export function useInfiniteScrollTrigger<T extends Element>({
	disabled = false,
	hasNextPage,
	isFetchingNextPage,
	onLoadMore,
	rootMargin = "300px",
}: UseInfiniteScrollTriggerOptions) {
	const [node, setNode] = useState<T | null>(null);

	useEffect(() => {
		if (disabled || !node || !hasNextPage) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextPage) {
					void onLoadMore();
				}
			},
			{ rootMargin },
		);

		observer.observe(node);

		return () => observer.disconnect();
	}, [disabled, hasNextPage, isFetchingNextPage, node, onLoadMore, rootMargin]);

	return setNode;
}
