import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import CommunityCard, {
	CommunityCardSkeleton,
} from "@/components/CommunityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getCategoryBySlug, getCommunitiesByCategoryId } from "@/lib/api";
import { buildPageHead, truncateDescription } from "@/lib/metadata";
import { getCategoryPageData } from "@/lib/page-data";

export const Route = createFileRoute("/categorias/$slug")({
	loader: async ({ params }) => {
		const slug = params?.slug;
		return {
			slug,
			initialCategory: await getCategoryPageData({ data: slug }),
		};
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return buildPageHead({
				path: "/categories",
				title: "Categoria | Templo",
				description:
					"Descubra páginas oficiais de comunidades desta categoria no Templo.",
			});
		}

		return buildPageHead({
			path: `/categories/${loaderData.slug}`,
			title: loaderData.initialCategory
				? `${loaderData.initialCategory.name} | Templo`
				: "Categoria | Templo",
			description: loaderData.initialCategory
				? truncateDescription(
						`Descubra páginas oficiais de comunidades de ${loaderData.initialCategory.name} no Templo.`,
					)
				: "Descubra páginas oficiais de comunidades desta categoria no Templo.",
		});
	},
	component: CategoryDetails,
});
const categoryDetailsCommunitySkeletonIds = [
	"category-details-community-1",
	"category-details-community-2",
	"category-details-community-3",
	"category-details-community-4",
	"category-details-community-5",
	"category-details-community-6",
];

function CategoryDetailsSkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
			<div className="glass-panel p-8">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-4">
						<Skeleton className="h-12 w-72 max-w-full" />
					</div>
					<Skeleton className="h-11 w-40 rounded-xl" />
				</div>
			</div>
			<div className="space-y-6">
				<div className="flex gap-8 border-b border-border-dark pb-4">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-5 w-28" />
					<Skeleton className="h-5 w-32" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{categoryDetailsCommunitySkeletonIds.map((id) => (
						<CommunityCardSkeleton key={id} />
					))}
				</div>
			</div>
		</div>
	);
}

function CategoryDetails() {
	const { session, isSessionLoading } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();

	const { slug, initialCategory } = Route.useLoaderData();

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		queryKey: ["category", slug],
		queryFn: ({ signal }) => getCategoryBySlug(slug, signal),
		initialData: initialCategory,
	});

	const { data: communitiesData, isLoading: isCommunitiesLoading } = useQuery({
		queryKey: ["communities", slug, category?.id],
		queryFn: ({ signal }) =>
			getCommunitiesByCategoryId(category?.id ?? "", signal),
		enabled: Boolean(category?.id),
	});
	const communities = category ? (communitiesData ?? []) : [];

	if (isCategoryLoading) {
		return <CategoryDetailsSkeleton />;
	}

	if (!category)
		return <div className="p-20 text-center">Categoria não encontrada.</div>;

	const handleCreateCommunity = () => {
		if (isSessionLoading) return;
		if (!session) {
			openAuthPrompt({
				title: "Criar comunidade",
				description: "Entre para criar a página oficial da sua comunidade.",
				redirectTo: `/criar-comunidade?category=${category.slug}`,
			});
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
			<div className="glass-panel p-8">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-2">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
							{category.name}
						</h1>
					</div>
					{session ? (
						<Link
							to={"/criar-comunidade"}
							search={{ category: category.slug }}
							className="btn-primary flex items-center gap-2"
						>
							<PlusCircle className="w-5 h-5" /> Criar Comunidade
						</Link>
					) : (
						<button
							type="button"
							onClick={handleCreateCommunity}
							disabled={isSessionLoading}
							className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<PlusCircle className="w-5 h-5" /> Criar Comunidade
						</button>
					)}
				</div>
			</div>

			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{isCommunitiesLoading
						? categoryDetailsCommunitySkeletonIds.map((id) => (
								<CommunityCardSkeleton key={id} />
							))
						: communities?.map((community) => (
								<CommunityCard key={community.id} community={community} />
							))}
					{!isCommunitiesLoading && communities?.length === 0 && (
						<div className="col-span-full py-20 text-center glass-panel">
							<p className="text-gray-500">
								Ainda não há comunidades para {category.name}.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
