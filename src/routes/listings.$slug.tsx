import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	ChevronRight,
	Copy,
	Eye,
	Heart,
	MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
	getListingBySlug,
	incrementListingViews,
	toggleListingLike,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { normalizeDiscordInvite } from "@/utils/discord";
import { getTypeText } from "@/utils/typeText";

export const Route = createFileRoute("/listings/$slug")({
	loader: async ({ params }) => {
		return { slug: params?.slug };
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
						<div className="glass-panel p-8 md:p-12 space-y-8">
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
						<div className="glass-panel p-8 space-y-8">
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

	const { slug } = Route.useLoaderData();

	const { data: listing, isLoading } = useQuery({
		queryKey: ["listing", slug],
		queryFn: ({ signal }) => getListingBySlug(slug, signal),
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
			<div className="fixed inset-0 z-0">
				<img
					src={listing.game.coverUrl}
					alt={`${listing.game.name} cover`}
					className="w-full h-full object-cover opacity-20 blur-xl scale-110"
					referrerPolicy="no-referrer"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-bg-dark/50 via-bg-dark to-bg-dark" />
			</div>

			<div className="relative z-10 max-w-6xl mx-auto px-4 py-12 space-y-8">
				<button
					type="button"
					onClick={handleBack}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-primary transition-colors text-sm font-bold group"
				>
					<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
					Voltar para página anterior
				</button>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Main Content */}
					<div className="lg:col-span-8 space-y-8">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="glass-panel p-8 md:p-12 space-y-8"
						>
							<div className="space-y-6">
								<div className="flex items-center gap-4">
									<span className="px-3 py-1 rounded-full text-[10px] font-black border border-brand-primary/30 bg-brand-primary/10 text-brand-primary uppercase tracking-[0.2em]">
										{getTypeText(listing.type)}
									</span>
									<div className="h-1 w-1 rounded-full bg-gray-600" />
									<span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
										Publicado em{" "}
										{new Date(listing.createdAt).toLocaleDateString("pt-BR")}
									</span>
								</div>

								<h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
									{listing.title}
								</h1>

								<div className="prose prose-invert max-w-none">
									<p className="text-gray-300 text-xl leading-relaxed font-medium whitespace-pre-wrap break-words">
										{listing.description}
									</p>
								</div>

								<div className="flex flex-wrap gap-2 pt-4">
									{listing.tags?.map((tag) => (
										<span
											key={tag}
											className="text-[10px] font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:border-brand-primary/30 hover:text-brand-primary transition-colors cursor-default"
										>
											#{tag.toUpperCase()}
										</span>
									))}
								</div>
							</div>
						</motion.div>

						{/* Game Info Card */}
						<Link
							to={`/games/$slug`}
							params={{ slug: listing.game.slug }}
							className="glass-panel p-6 flex items-center justify-between group cursor-pointer"
						>
							<div className="flex items-center gap-4">
								<img
									src={listing.game.coverUrl}
									className="w-16 h-16 rounded-xl object-cover border border-white/10"
									alt={listing.game.name}
									referrerPolicy="no-referrer"
								/>
								<div>
									<p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
										Jogo Relacionado
									</p>
									<h4 className="text-xl font-bold group-hover:text-brand-primary transition-colors">
										{listing.game.name}
									</h4>
								</div>
							</div>
							<ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
						</Link>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-4 space-y-6">
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className="glass-panel p-8 space-y-8 sticky top-24"
						>
							<Link
								to="/profile/$profileFullName"
								params={{ profileFullName: listing.profile.fullName }}
								className="flex items-center gap-4 pb-8 border-b border-white/5 transition-colors hover:text-brand-primary"
							>
								<div className="relative">
									<img
										src={listing.profile.avatarUrl}
										alt={`${listing.profile.fullName} avatar`}
										className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-primary/20"
										referrerPolicy="no-referrer"
									/>
									<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-bg-dark" />
								</div>
								<div>
									<p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
										Criado por
									</p>
									<p className="font-black text-xl tracking-tight">
										{listing.profile.fullName}
									</p>
								</div>
							</Link>

							<div className="space-y-4">
								<h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500">
									Ações Rápidas
								</h3>

								<div className="grid grid-cols-1 gap-3">
									{discordInviteUrl && (
										<a
											href={discordInviteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-sm btn-primary transition-all shadow-lg shadow-brand-primary/20 group"
										>
											<MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
											ENTRAR NO DISCORD
										</a>
									)}

									{listing.ip && (
										<button
											type="button"
											onClick={handleCopyIP}
											className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold text-xs bg-white/5 border border-white/10 text-gray-400 hover:border-brand-primary/50 hover:text-brand-primary transition-all"
										>
											{copied ? (
												<Check className="w-4 h-4 text-emerald-500" />
											) : (
												<Copy className="w-4 h-4" />
											)}
											{copied ? "COPIADO" : "COPIAR IP"}
										</button>
									)}

									<div className={cn("grid grid-cols-2 gap-2")}>
										<button
											type="button"
											onClick={handleLike}
											disabled={!canLike}
											className={cn(
												"flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold text-xs transition-all border",
												listing.userLiked
													? "bg-red-500/10 border-red-500/50 text-red-500"
													: canLike
														? "bg-white/5 border-white/10 text-gray-400 hover:border-red-500/50 hover:text-red-500"
														: "bg-white/5 border-white/10 text-gray-400",
											)}
										>
											<Heart
												className={cn(
													"w-4 h-4",
													listing.userLiked && "fill-current",
												)}
											/>
											{listing.likesCount}
										</button>

										<div className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold text-xs bg-white/5 border border-white/10 text-gray-400">
											<Eye className="w-4 h-4" />
											{displayedViewsCount}
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}
