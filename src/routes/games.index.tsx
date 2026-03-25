import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import GameCard from "@/components/GameCard";
import { getGames } from "@/lib/api";

export const Route = createFileRoute("/games/")({
	component: Games,
});

const pageSize = 12;

function Games() {
	const [search, setSearch] = useState("");

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery({
			queryKey: ["games"],
			initialPageParam: 0,
			queryFn: ({ pageParam, signal }) =>
				getGames({
					signal,
					limit: pageSize,
					offset: pageParam,
				}),
			getNextPageParam: (lastPage, allPages) => {
				if (lastPage.length < pageSize) return undefined;
				return allPages.flat().length;
			},
		});

	const games = data?.pages.flat() ?? [];

	const filteredGames = games?.filter(
		(game) =>
			game.name.toLowerCase().includes(search.toLowerCase()) ||
			game.genres.some((genre) =>
				genre.toLowerCase().includes(search.toLowerCase()),
			),
	);

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
			</div>{" "}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{filteredGames?.map((game) => (
					<GameCard key={game.id} game={game} />
				))}
			</div>
		</div>
	);
}
