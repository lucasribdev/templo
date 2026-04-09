import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Globe, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import GameArtwork from "@/components/GameArtwork";
import ListingCard from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getGameBySlug, getListingsByGameId } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ListingType } from "@/types";

export const Route = createFileRoute("/games/$slug")({
	loader: async ({ params }) => {
		return { slug: params?.slug };
	},
	component: GameDetails,
});
const gameDetailsListingSkeletonIds = [
	"game-details-listing-1",
	"game-details-listing-2",
	"game-details-listing-3",
	"game-details-listing-4",
	"game-details-listing-5",
	"game-details-listing-6",
];

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
			</div>
		</div>
	);
}

function GameDetailsSkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
			<div className="relative h-[300px] rounded-3xl overflow-hidden border border-border-dark">
				<Skeleton className="h-full w-full rounded-none" />
				<div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-bg-dark/30 to-transparent flex flex-col justify-end p-8">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
						<div className="space-y-4">
							<Skeleton className="h-12 w-72 max-w-full" />
							<div className="flex gap-4">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-4 w-24" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16 rounded-full" />
								<Skeleton className="h-6 w-20 rounded-full" />
								<Skeleton className="h-6 w-14 rounded-full" />
							</div>
						</div>
						<Skeleton className="h-11 w-40 rounded-xl" />
					</div>
				</div>
			</div>
			<div className="space-y-6">
				<div className="flex gap-8 border-b border-border-dark pb-4">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-5 w-28" />
					<Skeleton className="h-5 w-32" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{gameDetailsListingSkeletonIds.map((id) => (
						<ListingCardSkeleton key={id} />
					))}
				</div>
			</div>
		</div>
	);
}

function GameDetails() {
	const [activeTab, setActiveTab] = useState<ListingType>("SERVER");

	const { slug } = Route.useLoaderData();

	const { data: game, isLoading: isGameLoading } = useQuery({
		queryKey: ["game", slug],
		queryFn: ({ signal }) => getGameBySlug(slug, signal),
	});

	const { data: listingsData, isLoading: isListingsLoading } = useQuery({
		queryKey: ["listings", slug, game?.id],
		queryFn: ({ signal }) => getListingsByGameId(game?.id ?? "", signal),
		enabled: Boolean(game?.id),
	});

	if (isGameLoading) {
		return <GameDetailsSkeleton />;
	}

	if (!game)
		return <div className="p-20 text-center">Jogo não encontrado.</div>;

	const listings = listingsData?.filter((l) => l.type === activeTab);

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
			<div className="relative h-[300px] rounded-3xl overflow-hidden border border-border-dark">
				<GameArtwork game={game} variant="hero" className="opacity-80" />
				<div className="absolute inset-0 bg-gradient-to-t from-bg-dark flex flex-col justify-end p-8">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
						<div className="space-y-2">
							<h1 className="text-5xl font-bold tracking-tighter">
								{game.name}
							</h1>
							<div className="flex flex-wrap gap-4 text-sm text-gray-500">
								{game.releaseDate && (
									<div className="flex items-center gap-1">
										<Calendar className="w-4 h-4" />
										<span>
											Lançamento: {new Date(game.releaseDate).getFullYear()}
										</span>
									</div>
								)}
								{game.website && (
									<a
										href={game.website}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 hover:text-brand-primary transition-colors"
									>
										<Globe className="w-4 h-4" />
										<span>Site Oficial</span>
									</a>
								)}
							</div>
							<div className="flex gap-2">
								{game.genres?.map((genre) => (
									<span
										key={genre}
										className="text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10 text-gray-300"
									>
										{genre}
									</span>
								))}
							</div>
						</div>
						<Link
							to={`/create-listing`}
							search={{ game: game.slug }}
							className="btn-primary flex items-center gap-2"
						>
							<PlusCircle className="w-5 h-5" /> Criar anúncio
						</Link>
					</div>
				</div>
			</div>

			<div className="space-y-6">
				<div className="flex border-b border-border-dark gap-8">
					{(["SERVER", "COMMUNITY", "LFG"] as ListingType[]).map((type) => (
						<button
							type="button"
							key={type}
							onClick={() => setActiveTab(type)}
							className={cn(
								"pb-4 text-sm font-bold transition-all relative",
								activeTab === type
									? "text-brand-primary"
									: "text-gray-500 hover:text-gray-300",
							)}
						>
							{type === "SERVER"
								? "Servidores"
								: type === "COMMUNITY"
									? "Comunidades"
									: "Procurando Grupo"}
							{activeTab === type && (
								<motion.div
									layoutId="tab-underline"
									className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
								/>
							)}
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{isListingsLoading
						? gameDetailsListingSkeletonIds.map((id) => (
								<ListingCardSkeleton key={id} />
							))
						: listings?.map((listing) => (
								<ListingCard key={listing.id} listing={listing} />
							))}
					{!isListingsLoading && listings?.length === 0 && (
						<div className="col-span-full py-20 text-center glass-panel">
							<p className="text-gray-500">
								Ainda não há anúncios nesta categoria para {game.name}.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
