import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpDown,
	ChevronRight,
	Filter,
	Gamepad2,
	Info,
	Search,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useState } from "react";
import GameCard from "@/components/GameCard";
import ListingCard from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import { getGames, getListings } from "@/lib/api";
import type { Game, ListingSortBy, ListingType } from "@/types";

export const Route = createFileRoute("/")({ component: App });

const pageSize = 12;
const homeGameSkeletonIds = [
	"home-game-1",
	"home-game-2",
	"home-game-3",
	"home-game-4",
	"home-game-5",
	"home-game-6",
];
const homeListingSkeletonIds = Array.from(
	{ length: pageSize },
	(_, index) => `home-listing-${index + 1}`,
);

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

function ListingCardSkeleton() {
	return (
		<div className="glass-panel p-5 flex flex-col gap-4">
			<div className="flex justify-between items-start">
				<Skeleton className="h-5 w-28 rounded-full" />
				<Skeleton className="h-5 w-10" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
				<Skeleton className="h-5 w-12 rounded-full" />
			</div>
			<div className="pt-4 border-t border-border-dark flex justify-between items-center">
				<div className="flex items-center gap-3">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-20" />
				</div>
				<Skeleton className="h-4 w-20" />
			</div>
		</div>
	);
}

function App() {
	const [search, setSearch] = useState("");
	const [filterType, setFilterType] = useState<ListingType | "ALL">("ALL");
	const [filterGame, setFilterGame] = useState<string | "ALL">("ALL");
	const [sortBy, setSortBy] = useState<ListingSortBy>("DATE");

	const deferredSearch = useDeferredValue(search.trim());

	const { data: games } = useQuery({
		queryKey: ["games"],
		queryFn: ({ signal }) => getGames({ signal }),
	});

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: isListingsLoading,
	} = useInfiniteQuery({
		queryKey: ["listings", deferredSearch, filterType, filterGame, sortBy],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) =>
			getListings({
				signal,
				limit: pageSize,
				offset: pageParam,
				search: deferredSearch || undefined,
				type: filterType === "ALL" ? undefined : filterType,
				gameId: filterGame === "ALL" ? undefined : filterGame,
				sortBy,
			}),
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < pageSize) return undefined;
			return allPages.flat().length;
		},
	});

	const listings = data?.pages.flat() ?? [];
	const setLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>({
		hasNextPage,
		isFetchingNextPage,
		onLoadMore: fetchNextPage,
	});

	const handleFilterTypeChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		setFilterType(event.target.value as ListingType | "ALL");
	};
	const handleSortByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSortBy(event.target.value as ListingSortBy);
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
			<section className="text-center space-y-6 py-12">
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-5xl md:text-7xl font-bold tracking-tighter"
				>
					Onde os <span className="text-brand-primary">jogadores</span> se
					encontram.
				</motion.h1>
				<p className="text-gray-400 text-lg max-w-2xl mx-auto">
					Encontre servidores, comunidades e grupos para os seus jogos favoritos
					de PC. Tudo em um só lugar.
				</p>
			</section>

			<section className="hidden sm:block space-y-6">
				<div className="flex justify-between items-end">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Gamepad2 className="text-brand-primary" /> Jogos Populares
					</h2>
					<Link
						to="/games"
						className="text-sm text-brand-primary hover:underline"
					>
						Ver todos
					</Link>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
					{games
						? games
								.slice(0, 6)
								.map((game: Game) => <GameCard key={game.id} game={game} />)
						: homeGameSkeletonIds.map((id) => <GameCardSkeleton key={id} />)}
				</div>
			</section>

			<section className="space-y-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-3xl font-bold flex items-center gap-3">
							<Filter className="text-brand-primary w-7 h-7" /> Anúncios
						</h2>
						<p className="text-sm text-gray-500">
							Filtre e encontre exatamente o que você procura
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="relative group">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
							<input
								type="text"
								placeholder="Buscar por título..."
								className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>

						<div className="relative group">
							<Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors pointer-events-none" />
							<select
								value={filterGame}
								onChange={(e) => setFilterGame(e.target.value)}
								className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
							>
								<option value="ALL">Todos os Jogos</option>
								{games?.map((game) => (
									<option key={game.id} value={game.id}>
										{game.name}
									</option>
								))}
							</select>
							<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
								<ChevronRight className="w-4 h-4 rotate-90" />
							</div>
						</div>

						<div className="relative group">
							<Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors pointer-events-none" />
							<select
								value={filterType}
								onChange={handleFilterTypeChange}
								className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
							>
								<option value="ALL">Todos os Tipos</option>
								<option value="LFG">Procurando Grupo</option>
								<option value="SERVER">Servidores</option>
								<option value="COMMUNITY">Comunidades</option>
							</select>
							<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
								<ChevronRight className="w-4 h-4 rotate-90" />
							</div>
						</div>

						<div className="relative group">
							<ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors pointer-events-none" />
							<select
								value={sortBy}
								onChange={handleSortByChange}
								className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
							>
								<option value="DATE">Mais recentes</option>
								<option value="POPULARITY">Mais populares</option>
								<option value="RELEVANCE">Relevância</option>
							</select>
							<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
								<ChevronRight className="w-4 h-4 rotate-90" />
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{isListingsLoading
						? homeListingSkeletonIds.map((id) => (
								<ListingCardSkeleton key={id} />
							))
						: listings.map((listing) => (
								<ListingCard key={listing.id} listing={listing} />
							))}
					{isFetchingNextPage && (
						<div className="col-span-full text-center text-sm text-gray-400 py-4">
							Carregando mais anúncios...
						</div>
					)}
					{!isListingsLoading &&
						!isFetchingNextPage &&
						listings.length === 0 && (
							<div className="col-span-full py-20 text-center glass-panel">
								<Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
								<p className="text-gray-400">
									Nenhum anúncio encontrado para sua busca.
								</p>
							</div>
						)}
				</div>
				<div ref={setLoadMoreNode} />
			</section>
		</div>
	);
}
