import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CategoryCard from "@/components/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories } from "@/lib/api";
import { buildPageHead } from "@/lib/metadata";

export const Route = createFileRoute("/categorias/")({
	head: () =>
		buildPageHead({
			path: "/categories",
			title: "Explorar Categorias | Templo",
			description:
				"Explore categorias e descubra páginas oficiais de comunidades online no Templo.",
		}),
	component: Categories,
});

const pageSize = 20;
const categorySkeletonIds = [
	"categories-index-1",
	"categories-index-2",
	"categories-index-3",
	"categories-index-4",
	"categories-index-5",
	"categories-index-6",
	"categories-index-7",
	"categories-index-8",
];

export function CategoryCardSkeleton() {
	return (
		<div className="glass-panel p-4">
			<Skeleton className="h-4 w-2/3" />
			<div className="flex gap-2 pt-3">
				<Skeleton className="h-5 w-14 rounded-md" />
				<Skeleton className="h-5 w-16 rounded-md" />
			</div>
		</div>
	);
}

function Categories() {
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
			queryKey: ["categories", debouncedSearch, "ALPHABETICAL"],
			initialPageParam: 0,
			queryFn: ({ pageParam, signal }) =>
				getCategories({
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

	const categories = data?.pages.flat() ?? [];

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
					<h1 className="text-4xl font-bold tracking-tight">
						Explorar Categorias
					</h1>
					<p className="text-gray-500">
						Descubra páginas oficiais para suas categorias favoritas
					</p>
				</div>

				<div className="relative w-full md:w-80 group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
					<input
						type="text"
						placeholder="Filtrar categorias..."
						className="w-full h-11 bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-all"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
				{isLoading
					? categorySkeletonIds.map((id) => <CategoryCardSkeleton key={id} />)
					: categories?.map((category) => (
							<CategoryCard key={category.id} category={category} />
						))}
			</div>
			<div ref={loadMoreRef} />
		</div>
	);
}
