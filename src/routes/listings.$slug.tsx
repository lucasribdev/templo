import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, ExternalLink, Eye, Heart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import GameArtwork from "@/components/GameArtwork";
import ListingTypeBadge from "@/components/ListingTypeBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
	getListingBySlug,
	incrementListingViews,
	toggleListingLike,
} from "@/lib/api";
import { buildPageHead, truncateDescription } from "@/lib/metadata";
import { getListingPageData } from "@/lib/page-data";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { normalizeDiscordInvite } from "@/utils/discord";
import { getTypeText } from "@/utils/listing-type";
import { memberSince } from "@/utils/profile";

export const Route = createFileRoute("/listings/$slug")({
	loader: async ({ params }) => {
		const slug = params?.slug;
		return {
			slug,
			initialListing: await getListingPageData({ data: slug }),
		};
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return buildPageHead({
				path: "/listings",
				title: "Anúncio | Templo",
				description: "Veja os detalhes deste anúncio no Templo.",
			});
		}

		return buildPageHead({
			path: `/listings/${loaderData.slug}`,
			title: loaderData.initialListing
				? `${loaderData.initialListing.title} | Templo`
				: "Anúncio | Templo",
			description: loaderData.initialListing
				? truncateDescription(
						loaderData.initialListing.description ||
							`${getTypeText(loaderData.initialListing.type)} para ${loaderData.initialListing.game.name} criado por ${loaderData.initialListing.profile.fullName}.`,
					)
				: "Veja os detalhes deste anúncio no Templo.",
			image: loaderData.initialListing?.game.coverUrl || undefined,
		});
	},
	component: ListingDetails,
});

function ListingDetailsSkeleton() {
	return (
		<div className="min-h-screen relative">
			<div className="relative z-10 max-w-6xl mx-auto px-4 py-12 space-y-8">
				<Skeleton className="h-5 w-40" />
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					<div className="lg:col-span-8 space-y-8">
						<div className="glass-panel p-6 space-y-8">
							<div className="space-y-6">
								<div className="flex items-center gap-4">
									<Skeleton className="h-6 w-20 rounded-full" />
									<Skeleton className="h-2 w-2 rounded-full" />
									<Skeleton className="h-4 w-32" />
								</div>
								<Skeleton className="h-12 w-4/5" />
								<Skeleton className="h-12 w-3/5" />
								<div className="space-y-3">
									<Skeleton className="h-5 w-full" />
									<Skeleton className="h-5 w-full" />
									<Skeleton className="h-5 w-2/3" />
								</div>
								<div className="flex gap-2">
									<Skeleton className="h-6 w-16 rounded-full" />
									<Skeleton className="h-6 w-20 rounded-full" />
									<Skeleton className="h-6 w-14 rounded-full" />
								</div>
							</div>
						</div>
						<div className="glass-panel p-6 flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Skeleton className="h-16 w-16 rounded-xl" />
								<div className="space-y-2">
									<Skeleton className="h-3 w-24" />
									<Skeleton className="h-6 w-40" />
								</div>
							</div>
							<Skeleton className="h-6 w-6 rounded-full" />
						</div>
					</div>
					<div className="lg:col-span-4 space-y-6">
						<div className="glass-panel p-6 space-y-8">
							<div className="flex items-center gap-4 pb-8 border-b border-white/5">
								<Skeleton className="h-14 w-14 rounded-2xl" />
								<div className="space-y-2">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-6 w-28" />
								</div>
							</div>
							<div className="space-y-4">
								<Skeleton className="h-3 w-28" />
								<div className="grid grid-cols-1 gap-3">
									<Skeleton className="h-14 w-full rounded-2xl" />
									<div className="grid grid-cols-2 gap-3">
										<Skeleton className="h-14 w-full rounded-2xl" />
										<Skeleton className="h-14 w-full rounded-2xl" />
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

function ListingDetails() {
	const [copied, setCopied] = useState(false);
	const [viewsCount, setViewsCount] = useState<number | null>(null);

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { session, isSessionLoading } = useAuth();

	const { slug, initialListing } = Route.useLoaderData();

	const { data: listing, isLoading } = useQuery({
		queryKey: ["listing", slug],
		queryFn: ({ signal }) => getListingBySlug(slug, signal),
		initialData: initialListing,
	});

	useEffect(() => {
		if (!listing?.slug) {
			setViewsCount(null);
			return;
		}

		let isMounted = true;
		setViewsCount(listing.views);

		incrementListingViews(listing.slug)
			.then((updatedViews) => {
				if (!isMounted) return;
				setViewsCount(updatedViews);
			})
			.catch(() => undefined);

		return () => {
			isMounted = false;
		};
	}, [listing?.slug, listing?.views]);

	const likeMutation = useMutation({
		mutationFn: () => {
			if (!listing?.slug) {
				throw new Error("Missing listing slug");
			}

			return toggleListingLike(listing.slug);
		},
		onMutate: async () => {
			if (!listing?.slug) {
				return {};
			}

			await queryClient.cancelQueries({ queryKey: ["listing", listing.slug] });

			const previousListing = queryClient.getQueryData<Listing>([
				"listing",
				listing.slug,
			]);

			queryClient.setQueryData<Listing>(
				["listing", listing.slug],
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

			return { previousListing };
		},
		onError: (_error, _variables, context) => {
			if (listing?.slug && context?.previousListing) {
				queryClient.setQueryData(
					["listing", listing.slug],
					context.previousListing,
				);
			}
		},
		onSettled: async () => {
			if (!listing?.slug) return;

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["listing", listing.slug] }),
				queryClient.invalidateQueries({ queryKey: ["listings"] }),
				queryClient.invalidateQueries({ queryKey: ["profile"] }),
				queryClient.invalidateQueries({ queryKey: ["favorite-listings"] }),
			]);
		},
	});

	if (isLoading) {
		return <ListingDetailsSkeleton />;
	}

	if (!listing) {
		return <div className="p-20 text-center">Anúncio não encontrado.</div>;
	}

	const discordInviteUrl = normalizeDiscordInvite(listing.discordInvite ?? "");
	const displayedViewsCount = viewsCount ?? listing.views;
	const canLike =
		Boolean(session) && !isSessionLoading && !likeMutation.isPending;

	const handleCopyIP = () => {
		if ("ip" in listing && listing.ip) {
			navigator.clipboard.writeText(listing.ip);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleLike = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!listing.slug) return;
		if (isSessionLoading || !session || likeMutation.isPending) return;
		likeMutation.mutate();
	};

	const handleBack = () => {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		navigate({ to: "/games/$slug", params: { slug: listing.game.slug } });
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
								<GameArtwork
									game={listing.game}
									variant="tile"
									className="h-40 overflow-hidden md:h-56 rounded-t-2xl"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent" />
								<div className="absolute bottom-4 left-4">
									<ListingTypeBadge type={listing.type} />
								</div>
							</div>

							<div className="p-6 space-y-6">
								<div className="flex items-center gap-3 mb-2">
									<Link
										to={`/games/$slug`}
										params={{ slug: listing.game.slug }}
										className="text-brand-primary text-xs transition-colors hover:underline"
									>
										{listing.game.name}
									</Link>
									<div className="h-1 w-1 rounded-full bg-gray-600" />
									<span className="text-gray-500 uppercase text-xs">
										{new Date(listing.createdAt).toLocaleDateString("pt-BR")}
									</span>
								</div>

								<h1 className="text-2xl font-bold leading-snug mb-1">
									{listing.title}
								</h1>

								<div className="flex gap-3 mb-0">
									<div className="flex items-center gap-2 font-bold text-xs text-gray-400">
										<Eye className="w-4 h-4" />
										<span>
											{displayedViewsCount}{" "}
											{displayedViewsCount === 1 ? "view" : "views"}
										</span>
									</div>

									<button
										type="button"
										onClick={handleLike}
										disabled={!canLike}
										className={cn(
											"flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold text-xs transition-all border",
											listing.userLiked
												? "text-red-500 border-0"
												: canLike
													? "text-gray-400 border-0 hover:text-red-500"
													: "text-gray-400 border-0",
										)}
									>
										<Heart
											className={cn(
												"w-4 h-4",
												listing.userLiked && "fill-current",
											)}
										/>
										{listing.likesCount}{" "}
										{listing.likesCount === 1 ? "curtida" : "curtidas"}
									</button>
								</div>

								<div className="flex flex-wrap gap-2 pt-1">
									{listing.tags?.map((tag) => (
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
										{listing.description}
									</p>
								</div>

								<div className="flex gap-3">
									{discordInviteUrl && (
										<a
											href={discordInviteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm btn-primary transition-all shadow-lg shadow-brand-primary/20 group"
										>
											<ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
											Entrar no Discord
										</a>
									)}

									{listing.ip && (
										<button
											type="button"
											onClick={handleCopyIP}
											className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-400 hover:border-brand-primary/50 hover:text-brand-primary transition-all"
										>
											{copied ? (
												<Check className="w-4 h-4 text-emerald-500" />
											) : (
												<Copy className="w-4 h-4" />
											)}
											{copied ? "COPIADO" : "COPIAR IP"}
										</button>
									)}
								</div>

								<Link
									to="/profile/$profileFullName"
									params={{ profileFullName: listing.profile.fullName }}
									className="flex items-center gap-4 pt-6 border-t border-white/5 transition-colors hover:text-brand-primary"
								>
									<div className="relative">
										<img
											src={listing.profile.avatarUrl}
											alt={`${listing.profile.fullName} avatar`}
											className="w-14 h-14 rounded-full object-cover"
											referrerPolicy="no-referrer"
										/>
									</div>
									<div>
										<p className="font-semibold text-md tracking-tight">
											{listing.profile.fullName}
										</p>
										<p className="text-xs text-gray-400">
											Membro desde {memberSince(listing.profile)}
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
