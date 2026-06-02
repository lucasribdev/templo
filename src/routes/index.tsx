import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpDown,
	ChevronRight,
	Flame,
	Info,
	Search,
	Sparkles,
	Tags,
} from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import CommunityCard from "@/components/CommunityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiscordInviteStats } from "@/hooks/use-discord-invite-stats";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import { getCategories, getCommunities } from "@/lib/api";
import { buildPageHead } from "@/lib/metadata";
import type { Category, CommunitySortBy } from "@/types";
import { extractDiscordInviteCode } from "@/utils/discord";

export const Route = createFileRoute("/")({
	head: () =>
		buildPageHead({
			path: "/",
			title: "Templo - Encontre outros jogadores facilmente",
		}),
	component: App,
});

const pageSize = 12;
const homeCategorySkeletonIds = [
	"home-category-1",
	"home-category-2",
	"home-category-3",
	"home-category-4",
	"home-category-5",
	"home-category-6",
];
const homeCommunitySkeletonIds = Array.from(
	{ length: pageSize },
	(_, index) => `home-community-${index + 1}`,
);

function CategoryCardSkeleton() {
	return (
		<div className="relative aspect-video rounded-xl overflow-hidden bg-card-dark">
			<Skeleton className="h-full w-full rounded-none" />
			<div className="absolute inset-0 flex flex-col justify-end p-3">
				<Skeleton className="h-4 w-2/3" />
				<div className="flex gap-2 pt-2">
					<Skeleton className="h-5 w-14 rounded-md" />
					<Skeleton className="h-5 w-16 rounded-md" />
				</div>
			</div>
		</div>
	);
}

function CommunityCardSkeleton() {
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
			<div className="pt-4 border-t border-border-dark flex justify-between items-center gap-3">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<Skeleton className="h-4 w-4 rounded-full" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-3 w-10" />
				</div>
				<Skeleton className="h-4 w-20" />
			</div>
		</div>
	);
}

function App() {
	const [search, setSearch] = useState("");
	const [filterCategory, setFilterCategory] = useState<string | "ALL">("ALL");
	const [sortBy, setSortBy] = useState<CommunitySortBy>("DATE");

	const deferredSearch = useDeferredValue(search.trim());

	const { data: categories } = useQuery({
		queryKey: ["categories"],
		queryFn: ({ signal }) => getCategories({ signal }),
	});

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: isCommunitiesLoading,
	} = useInfiniteQuery({
		queryKey: ["communities", deferredSearch, filterCategory, sortBy],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) =>
			getCommunities({
				signal,
				limit: pageSize,
				offset: pageParam,
				search: deferredSearch || undefined,
				categoryId: filterCategory === "ALL" ? undefined : filterCategory,
				sortBy,
			}),
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < pageSize) return undefined;
			return allPages.flat().length;
		},
	});

	const communities = data?.pages.flat() ?? [];
	const { data: discordStatsByCode } = useDiscordInviteStats(communities);
	const setLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>({
		hasNextPage,
		isFetchingNextPage,
		onLoadMore: fetchNextPage,
	});

	const handleSortByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSortBy(event.target.value as CommunitySortBy);
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
			<section className="text-center space-y-6 py-12">
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-5xl md:text-6xl font-bold tracking-tighter"
				>
					Onde os <span className="text-brand-primary">jogadores</span> se
					encontram.
				</motion.h1>
				<p className="text-gray-400 text-lg max-w-2xl mx-auto">
					Descubra comunidades, clãs e guildas para jogar. Conecte-se com
					jogadores que compartilham sua paixão.
				</p>
			</section>

			<section className="hidden md:block space-y-6">
				<div className="flex justify-between items-end">
					<h2 className="text-lg font-bold flex items-center gap-2">
						<Flame className="text-brand-primary w-5 h-5" /> Categorias em
						Destaque
					</h2>
					<Link
						to="/categories"
						className="text-sm text-brand-primary hover:underline"
					>
						Ver todas
					</Link>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					{categories
						? categories
								.slice(0, 6)
								.map((category: Category) => (
									<CategoryCard key={category.id} category={category} />
								))
						: homeCategorySkeletonIds.map((id) => (
								<CategoryCardSkeleton key={id} />
							))}
				</div>
			</section>

			<section className="space-y-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-bold flex items-center gap-3">
							<Sparkles className="text-brand-primary w-5 h-5" /> Comunidades
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
							<Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors pointer-events-none" />
							<select
								value={filterCategory}
								onChange={(e) => setFilterCategory(e.target.value)}
								className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
							>
								<option value="ALL">Todas as categorias</option>
								{categories?.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
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

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{isCommunitiesLoading
						? homeCommunitySkeletonIds.map((id) => (
								<CommunityCardSkeleton key={id} />
							))
						: communities.map((community) => (
								<CommunityCard
									key={community.id}
									community={community}
									discordStats={
										discordStatsByCode?.[
											extractDiscordInviteCode(community.discordInvite) ?? ""
										]
									}
								/>
							))}
					{isFetchingNextPage && (
						<div className="col-span-full text-center text-sm text-gray-400 py-4">
							Carregando mais comunidades...
						</div>
					)}
					{!isCommunitiesLoading &&
						!isFetchingNextPage &&
						communities.length === 0 && (
							<div className="col-span-full py-20 text-center glass-panel">
								<Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
								<p className="text-gray-400">
									Nenhuma comunidade encontrada para sua busca.
								</p>
							</div>
						)}
				</div>
				<div ref={setLoadMoreNode} />
			</section>
		</div>
	);
}
