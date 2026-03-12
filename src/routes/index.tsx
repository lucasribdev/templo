import { useQuery } from "@tanstack/react-query";
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
import { useState } from "react";
import GameCard from "@/components/GameCard";
import ListingCard from "@/components/ListingCard";
import { getGames, getListings } from "@/lib/api";
import type { Game, ListingType } from "@/types";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const [search, setSearch] = useState("");
	const [filterType, setFilterType] = useState<ListingType | "ALL">("ALL");
	const [filterGame, setFilterGame] = useState<string | "ALL">("ALL");
	const [sortBy, setSortBy] = useState<"DATE" | "POPULARITY" | "RELEVANCE">(
		"DATE",
	);

	const {
		data: games,
		isLoading: isGamesLoading,
		isError: isGamesError,
	} = useQuery({
		queryKey: ["games"],
		queryFn: ({ signal }) => getGames(signal),
	});

	const {
		data: listings,
		isLoading: isListingsLoading,
		isError: isListingsError,
	} = useQuery({
		queryKey: ["listings"],
		queryFn: ({ signal }) => getListings(signal),
	});

	const normalizedSearch = search.trim().toLowerCase();
	const filteredListings = (listings ?? [])
		.filter((l) => {
			const gameName =
				games?.find((g) => g.id === l.gameId)?.name?.toLowerCase() ?? "";
			const matchesSearch =
				normalizedSearch.length === 0 ||
				l.title.toLowerCase().includes(normalizedSearch) ||
				gameName.includes(normalizedSearch);
			const matchesType = filterType === "ALL" || l.type === filterType;
			const matchesGame = filterGame === "ALL" || l.gameId === filterGame;
			return matchesSearch && matchesType && matchesGame;
		})
		.sort((a, b) => {
			if (sortBy === "DATE") {
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			}
			if (sortBy === "POPULARITY") {
				return b.views - a.views;
			}
			if (sortBy === "RELEVANCE") {
				// Simple relevance: if search matches title, it's more relevant
				if (normalizedSearch.length > 0) {
					const aTitleMatch = a.title.toLowerCase().includes(normalizedSearch);
					const bTitleMatch = b.title.toLowerCase().includes(normalizedSearch);
					if (aTitleMatch && !bTitleMatch) return -1;
					if (!aTitleMatch && bTitleMatch) return 1;
				}
				return 0;
			}
			return 0;
		});

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

			<section className="space-y-6">
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
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
					{games?.map((game: Game) => (
						<GameCard key={game.id} game={game} />
					))}
				</div>
			</section>

			<section className="space-y-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-3xl font-bold flex items-center gap-3">
							<Filter className="text-brand-primary w-7 h-7" /> Chamados
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
								onChange={(e) => setFilterType(e.target.value as any)}
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
								onChange={(e) => setSortBy(e.target.value as any)}
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
					{filteredListings.map((listing) => (
						<ListingCard
							key={listing.id}
							listing={listing}
							game={games?.find((g) => g.id === listing.gameId)}
						/>
					))}
					{filteredListings.length === 0 && (
						<div className="col-span-full py-20 text-center glass-panel">
							<Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
							<p className="text-gray-400">
								Nenhum anúncio encontrado para sua busca.
							</p>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
