import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Eye, Heart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import CategoryArtwork from "@/components/CategoryArtwork";
import UserAvatar from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useDiscordInviteStats } from "@/hooks/use-discord-invite-stats";
import {
	getCommunityBySlug,
	incrementCommunityViews,
	toggleCommunityLike,
} from "@/lib/api";
import { buildPageHead, truncateDescription } from "@/lib/metadata";
import { getCommunityPageData } from "@/lib/page-data";
import { cn } from "@/lib/utils";
import type { Community } from "@/types";
import { formatPostedAt } from "@/utils/date";
import { normalizeDiscordInvite } from "@/utils/discord";
import { memberSince } from "@/utils/profile";

export const Route = createFileRoute("/comunidades/$slug")({
	loader: async ({ params }) => {
		const slug = params?.slug;
		return {
			slug,
			initialCommunity: await getCommunityPageData({ data: slug }),
		};
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return buildPageHead({
				path: "/comunidades",
				title: "Comunidade | Templo",
				description: "Veja os detalhes desta comunidade no Templo.",
			});
		}

		return buildPageHead({
			path: `/comunidades/${loaderData.slug}`,
			title: loaderData.initialCommunity
				? `${loaderData.initialCommunity.title} | Templo`
				: "Comunidade | Templo",
			description: loaderData.initialCommunity
				? truncateDescription(
						loaderData.initialCommunity.description ||
							`Comunidade de ${loaderData.initialCommunity.category.name} criada por ${loaderData.initialCommunity.profile.fullName}.`,
					)
				: "Veja os detalhes desta comunidade no Templo.",
			image: loaderData.initialCommunity?.category.coverUrl || undefined,
		});
	},
	component: CommunityDetails,
});

function CommunityDetailsSkeleton() {
	return (
		<div className="min-h-screen relative">
			<div className="relative z-10 max-w-6xl mx-auto px-4 py-12 space-y-8">
				<Skeleton className="h-5 w-40" />
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					<div className="lg:col-span-12 space-y-8">
						<div className="glass-panel space-y-8 overflow-hidden">
							<div className="relative mb-0">
								<Skeleton className="h-40 w-full rounded-none md:h-56" />
							</div>
							<div className="p-6 space-y-6">
								<div className="flex items-center gap-3 mb-2">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-1 w-1 rounded-full" />
									<Skeleton className="h-3 w-16" />
								</div>

								<div className="space-y-3">
									<Skeleton className="h-6 w-24 rounded-full" />
									<Skeleton className="h-8 w-4/5" />
								</div>

								<div className="flex gap-3 mb-0">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-24" />
								</div>

								<div className="flex flex-wrap gap-2 pt-1">
									<Skeleton className="h-7 w-20 rounded-full" />
									<Skeleton className="h-7 w-24 rounded-full" />
									<Skeleton className="h-7 w-16 rounded-full" />
								</div>

								<div className="space-y-3">
									<Skeleton className="h-5 w-full" />
									<Skeleton className="h-5 w-full" />
									<Skeleton className="h-5 w-2/3" />
								</div>

								<div className="flex flex-wrap gap-3">
									<Skeleton className="h-14 w-48 rounded-2xl" />
									<Skeleton className="h-14 w-40 rounded-2xl" />
								</div>

								<div className="flex items-center gap-4 pt-6 border-t border-white/5">
									<Skeleton className="h-14 w-14 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-5 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function CommunityDetails() {
	const [viewsCount, setViewsCount] = useState<number | null>(null);

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { session, isSessionLoading } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();

	const { slug, initialCommunity } = Route.useLoaderData();

	const { data: community, isLoading } = useQuery({
		queryKey: ["community", slug],
		queryFn: ({ signal }) => getCommunityBySlug(slug, signal),
		initialData: initialCommunity,
	});

	useEffect(() => {
		if (!community?.slug) {
			setViewsCount(null);
			return;
		}

		let isMounted = true;
		setViewsCount(community.views);

		incrementCommunityViews(community.slug)
			.then((updatedViews) => {
				if (!isMounted) return;
				setViewsCount(updatedViews);
			})
			.catch(() => undefined);

		return () => {
			isMounted = false;
		};
	}, [community?.slug, community?.views]);

	const likeMutation = useMutation({
		mutationFn: () => {
			if (!community?.slug) {
				throw new Error("Missing community slug");
			}

			return toggleCommunityLike(community.slug);
		},
		onMutate: async () => {
			if (!community?.slug) {
				return {};
			}

			await queryClient.cancelQueries({
				queryKey: ["community", community.slug],
			});

			const previousCommunity = queryClient.getQueryData<Community>([
				"community",
				community.slug,
			]);

			queryClient.setQueryData<Community>(
				["community", community.slug],
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						userLiked: !current.userLiked,
						likesCount: current.likesCount + (current.userLiked ? -1 : 1),
					};
				},
			);

			return { previousCommunity };
		},
		onError: (_error, _variables, context) => {
			if (community?.slug && context?.previousCommunity) {
				queryClient.setQueryData(
					["community", community.slug],
					context.previousCommunity,
				);
			}
		},
		onSettled: async () => {
			if (!community?.slug) return;

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["community", community.slug],
				}),
				queryClient.invalidateQueries({ queryKey: ["communities"] }),
				queryClient.invalidateQueries({ queryKey: ["profile"] }),
				queryClient.invalidateQueries({ queryKey: ["favorite-communities"] }),
			]);
		},
	});
	const { data: discordStatsByCode } = useDiscordInviteStats(
		community ? [community] : [],
	);

	if (isLoading) {
		return <CommunityDetailsSkeleton />;
	}

	if (!community) {
		return <div className="p-20 text-center">Comunidade não encontrada.</div>;
	}

	const discordInviteUrl = normalizeDiscordInvite(
		community.discordInvite ?? "",
	);
	const discordStats = discordInviteUrl
		? Object.values(discordStatsByCode ?? {})[0]
		: undefined;
	const displayedViewsCount = viewsCount ?? community.views;

	const handleLike = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!community.slug) return;
		if (isSessionLoading || likeMutation.isPending) return;
		if (!session) {
			openAuthPrompt({
				title: "Curtir comunidade",
				description:
					"Entre ou cadastre-se com Discord para curtir comunidades.",
				redirectTo: `/comunidades/${community.slug}`,
			});
			return;
		}
		likeMutation.mutate();
	};

	const handleBack = () => {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		navigate({
			to: "/categorias/$slug",
			params: { slug: community.category.slug },
		});
	};

	return (
		<div className="min-h-screen relative">
			<div className="relative z-10 max-w-6xl mx-auto px-4 py-12 space-y-8">
				<button
					type="button"
					onClick={handleBack}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors text-sm group"
				>
					<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
					Voltar
				</button>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Main Content */}
					<div className="lg:col-span-12 space-y-8">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-panel space-y-8"
						>
							<div className="relative mb-0">
								<CategoryArtwork
									category={community.category}
									variant="tile"
									className="h-40 overflow-hidden md:h-56 rounded-t-2xl"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent" />
							</div>

							<div className="p-6 space-y-6">
								<div className="flex items-center gap-3 mb-2">
									<Link
										to={"/categorias/$slug"}
										params={{ slug: community.category.slug }}
										className="text-brand-primary text-xs transition-colors hover:underline"
									>
										{community.category.name}
									</Link>
									<div className="h-1 w-1 rounded-full bg-gray-600" />
									<span className="text-gray-500 text-xs">
										{formatPostedAt(community.createdAt)}
									</span>
								</div>

								<h1 className="text-2xl font-bold leading-snug mb-1">
									{community.title}
								</h1>

								<div className="flex gap-3 mb-0">
									<div className="flex items-center gap-2 font-bold text-xs text-gray-400">
										<Eye className="w-4 h-4" />
										<span>
											{displayedViewsCount}{" "}
											{displayedViewsCount === 1
												? "visualização"
												: "visualizações"}
										</span>
									</div>
									{discordStats?.approximatePresenceCount !== null &&
										discordStats?.approximatePresenceCount !== undefined && (
											<div
												className="flex items-center gap-2 font-bold text-xs text-gray-400"
												title={`${discordStats.approximatePresenceCount} online agora no Discord`}
											>
												<span className="size-2 rounded-full bg-brand-primary" />
												<span>
													{discordStats.approximatePresenceCount} online
												</span>
											</div>
										)}

									<button
										type="button"
										onClick={handleLike}
										disabled={isSessionLoading || likeMutation.isPending}
										className={cn(
											"flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold text-xs transition-all border",
											community.userLiked
												? "text-red-500 border-0"
												: "text-gray-400 border-0 hover:text-red-500",
										)}
									>
										<Heart
											className={cn(
												"w-4 h-4",
												community.userLiked && "fill-current",
											)}
										/>
										{community.likesCount}{" "}
										{community.likesCount === 1 ? "curtida" : "curtidas"}
									</button>
								</div>

								<div className="flex flex-wrap gap-2 pt-1">
									{community.tags?.map((tag) => (
										<span
											key={tag}
											className="text-[10px] font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:border-brand-primary/30 hover:text-brand-primary transition-colors cursor-default"
										>
											#{tag.toUpperCase()}
										</span>
									))}
								</div>

								<div className="prose prose-invert max-w-none">
									<p className="text-gray-300 text-md leading-relaxed	whitespace-pre-wrap break-words">
										{community.description}
									</p>
								</div>

								<div className="flex gap-3">
									{discordInviteUrl && (
										<a
											href={discordInviteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm btn-discord transition-all shadow-lg shadow-discord/20 group"
										>
											<ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
											Entrar no Discord
										</a>
									)}
								</div>

								<Link
									to="/perfil/$profileFullName"
									params={{ profileFullName: community.profile.fullName }}
									className="flex items-center gap-4 pt-6 border-t border-white/5 transition-colors hover:text-brand-primary"
								>
									<div className="relative">
										<UserAvatar
											avatarUrl={community.profile.avatarUrl}
											className="w-14 h-14 rounded-full object-cover"
											name={community.profile.fullName}
										/>
									</div>
									<div>
										<p className="font-semibold text-md tracking-tight">
											{community.profile.fullName}
										</p>
										<p className="text-xs text-gray-400">
											Membro desde {memberSince(community.profile)}
										</p>
									</div>
								</Link>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}
