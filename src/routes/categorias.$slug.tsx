import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Globe, PlusCircle } from "lucide-react";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import CategoryArtwork from "@/components/CategoryArtwork";
import CommunityCard from "@/components/CommunityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useDiscordInviteStats } from "@/hooks/use-discord-invite-stats";
import { getCategoryBySlug, getCommunitiesByCategoryId } from "@/lib/api";
import { buildPageHead, truncateDescription } from "@/lib/metadata";
import { getCategoryPageData } from "@/lib/page-data";
import { extractDiscordInviteCode } from "@/utils/discord";

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
				description: "Encontre comunidades para esta categoria no Templo.",
			});
		}

		return buildPageHead({
			path: `/categories/${loaderData.slug}`,
			title: loaderData.initialCategory
				? `${loaderData.initialCategory.name} | Templo`
				: "Categoria | Templo",
			description: loaderData.initialCategory
				? truncateDescription(
						`Encontre comunidades ativas de ${loaderData.initialCategory.name} no Templo.`,
					)
				: "Encontre comunidades para esta categoria no Templo.",
			image: loaderData.initialCategory?.coverUrl || undefined,
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

function CategoryDetailsSkeleton() {
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
	const { data: discordStatsByCode } = useDiscordInviteStats(communities ?? []);

	if (isCategoryLoading) {
		return <CategoryDetailsSkeleton />;
	}

	if (!category)
		return <div className="p-20 text-center">Categoria não encontrada.</div>;

	const handleCreateCommunity = () => {
		if (isSessionLoading) return;
		if (!session) {
			openAuthPrompt({
				title: "Cadastrar comunidade",
				description:
					"Você precisa estar autenticado para cadastrar uma comunidade.",
				redirectTo: `/cadastrar-comunidade?category=${category.slug}`,
			});
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
			<div className="relative h-[300px] rounded-3xl overflow-hidden border border-border-dark">
				<CategoryArtwork
					category={category}
					variant="hero"
					className="opacity-80"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-bg-dark flex flex-col justify-end p-8">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
						<div className="space-y-2">
							<h1 className="text-5xl font-bold tracking-tighter">
								{category.name}
							</h1>
							<div className="flex flex-wrap gap-4 text-sm text-gray-500">
								{category.releaseDate && (
									<div className="flex items-center gap-1">
										<Calendar className="w-4 h-4" />
										<span>
											Lançamento: {new Date(category.releaseDate).getFullYear()}
										</span>
									</div>
								)}
								{category.website && (
									<a
										href={category.website}
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
								{category.genres?.map((genre) => (
									<span
										key={genre}
										className="text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10 text-gray-300"
									>
										{genre}
									</span>
								))}
							</div>
						</div>
						{session ? (
							<Link
								to={"/cadastrar-comunidade"}
								search={{ category: category.slug }}
								className="btn-primary flex items-center gap-2"
							>
								<PlusCircle className="w-5 h-5" /> Cadastrar Comunidade
							</Link>
						) : (
							<button
								type="button"
								onClick={handleCreateCommunity}
								disabled={isSessionLoading}
								className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<PlusCircle className="w-5 h-5" /> Cadastrar Comunidade
							</button>
						)}
					</div>
				</div>
			</div>

			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{isCommunitiesLoading
						? categoryDetailsCommunitySkeletonIds.map((id) => (
								<CommunityCardSkeleton key={id} />
							))
						: communities?.map((community) => (
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
