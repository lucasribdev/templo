import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import GameCard from "@/components/GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getGames } from "@/lib/api";

export const Route = createFileRoute("/games/")({
	component: Games,
});

const pageSize = 20;
const gameSkeletonIds = [
	"games-index-1",
	"games-index-2",
	"games-index-3",
	"games-index-4",
	"games-index-5",
	"games-index-6",
	"games-index-7",
	"games-index-8",
];

function GameCardSkeleton() {
	return (
		<div className="relative aspect-video rounded-xl overflow-hidden border border-border-dark bg-card-dark">
			<Skeleton className="h-full w-full rounded-none" />
			<div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
				<Skeleton className="h-6 w-2/3" />
				<div className="flex gap-2">
					<Skeleton className="h-4 w-12 rounded-full" />
					<Skeleton className="h-4 w-16 rounded-full" />
				</div>
			</div>
		</div>
	);
}

function Games() {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [search]);

	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery({
			queryKey: ["games", debouncedSearch, "ALPHABETICAL"],
			initialPageParam: 0,
			queryFn: ({ pageParam, signal }) =>
				getGames({
					signal,
					limit: pageSize,
					offset: pageParam,
					search: debouncedSearch,
					sortBy: "ALPHABETICAL",
				}),
			getNextPageParam: (lastPage, allPages) => {
				if (lastPage.length < pageSize) return undefined;
				return allPages.flat().length;
			},
		});

	const games = data?.pages.flat() ?? [];

	useEffect(() => {
		const node = loadMoreRef.current;
		if (!node || !hasNextPage) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextPage) {
					void fetchNextPage();
				}
			},
			{ rootMargin: "300px" },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	return (
		<div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<div className="space-y-1">
					<h1 className="text-4xl font-bold tracking-tight">Explorar Jogos</h1>
					<p className="text-gray-500">
						Encontre comunidades para seus títulos favoritos
					</p>
				</div>

				<div className="relative w-full md:w-80 group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
					<input
						type="text"
						placeholder="Filtrar jogos ou tags..."
						className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
				{isLoading
					? gameSkeletonIds.map((id) => <GameCardSkeleton key={id} />)
					: games?.map((game) => <GameCard key={game.id} game={game} />)}
			</div>
			<div ref={loadMoreRef} />
		</div>
	);
}
