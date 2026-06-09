import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpDown,
	ChevronRight,
	Info,
	Search,
	Sparkles,
	Tags,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import CommunityCard, {
	CommunityCardSkeleton,
} from "@/components/CommunityCard";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import { getCategories, getCommunities } from "@/lib/api";
import { buildPageHead } from "@/lib/metadata";
import type { Category, CommunitySortBy } from "@/types";
import { CategoryCardSkeleton } from "./categorias.index";

export const Route = createFileRoute("/")({
	head: () =>
		buildPageHead({
			path: "/",
			title: "Templo - Toda comunidade merece um endereço próprio",
			description:
				"Crie e descubra páginas oficiais de comunidades online. Reúna canais, identidade e presença em um endereço fácil de compartilhar.",
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
				<h1 className="animate-hero-title text-5xl md:text-6xl font-bold tracking-tighter">
					Encontre sua <span className="text-brand-primary">tribo</span>.
				</h1>
				<p className="text-gray-400 text-lg max-w-2xl mx-auto">
					Descubra comunidades de tecnologia, esportes, hobbies, investimentos,
					games e muito mais.
				</p>
			</section>

			<section className="space-y-6">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					{categories
						? categories
								.slice(0, 5)
								.map((category: Category) => (
									<CategoryCard key={category.id} category={category} />
								))
						: homeCategorySkeletonIds.map((id) => (
								<CategoryCardSkeleton key={id} />
							))}
					{categories ? (
						<Link to="/categorias" className="group">
							<div className="flex flex-col justify-between glass-panel h-full p-4 transition-all group-hover:border-brand-primary">
								<h3 className="text-sm font-bold text-white tracking-wide">
									Ver mais
								</h3>
								<div className="flex items-center gap-2 pt-3 text-xs text-brand-primary">
									<span>Explorar categorias</span>
									<ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
								</div>
							</div>
						</Link>
					) : null}
				</div>
			</section>

			<section className="space-y-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-bold flex items-center gap-3">
							<Sparkles className="text-brand-primary w-5 h-5" /> Comunidades
						</h2>
						<p className="text-sm text-gray-500">
							Descubra páginas oficiais e encontre os canais certos para cada
							comunidade.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="relative group">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
							<input
								type="text"
								placeholder="Buscar comunidades..."
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
								<CommunityCard key={community.id} community={community} />
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
