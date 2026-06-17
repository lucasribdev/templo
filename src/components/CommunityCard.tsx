import {
	SiDiscord,
	SiGithub,
	SiInstagram,
	SiTelegram,
	SiWhatsapp,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink } from "@tanstack/react-router";
import { Eye, Globe2, Heart, Link as LinkIcon, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthPrompt } from "@/components/AuthPrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { toggleCommunityLike } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Community, CommunityPlatform } from "@/types";

const communityPlatformMeta: Record<
	CommunityPlatform,
	{
		label: string;
		Icon: typeof LinkIcon;
	}
> = {
	DISCORD: { label: "Discord", Icon: SiDiscord },
	TELEGRAM: { label: "Telegram", Icon: SiTelegram },
	WHATSAPP: { label: "WhatsApp", Icon: SiWhatsapp },
	GITHUB: { label: "GitHub", Icon: SiGithub },
	YOUTUBE: { label: "YouTube", Icon: SiYoutube },
	INSTAGRAM: { label: "Instagram", Icon: SiInstagram },
	SITE_OFICIAL: { label: "Site oficial", Icon: Globe2 },
	OUTRA: { label: "Outro canal", Icon: LinkIcon },
};

function getCommunityPlatforms(community: Community) {
	const platforms = new Set<CommunityPlatform>();

	for (const link of community.links) {
		platforms.add(link.platform);
	}

	return Array.from(platforms);
}

export function CommunityCardSkeleton() {
	return (
		<div className="glass-panel p-5 flex flex-col gap-4">
			<div className="flex justify-between items-start gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-6 w-3/4 max-w-56" />
					<div className="flex items-center gap-1.5">
						<Skeleton className="h-3 w-3 rounded-sm" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
				<div className="flex items-center gap-1">
					<Skeleton className="h-3 w-5" />
					<Skeleton className="h-5 w-5 rounded-full" />
				</div>
			</div>

			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-4/5" />
			</div>

			<div className="mt-auto flex items-center justify-between gap-3">
				<div className="flex flex-wrap gap-2">
					<Skeleton className="h-5 w-14 rounded-md" />
					<Skeleton className="h-5 w-16 rounded-md" />
					<Skeleton className="h-5 w-12 rounded-md" />
				</div>
				<div className="flex items-center gap-1">
					<Skeleton className="h-3 w-3 rounded-full" />
					<Skeleton className="h-3 w-7" />
				</div>
			</div>
		</div>
	);
}

export default function CommunityCard({ community }: { community: Community }) {
	const queryClient = useQueryClient();
	const { session, isSessionLoading } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();
	const communityPlatforms = getCommunityPlatforms(community);
	const [likeState, setLikeState] = useState({
		likesCount: community.likesCount,
		userLiked: community.userLiked,
	});

	useEffect(() => {
		setLikeState({
			likesCount: community.likesCount,
			userLiked: community.userLiked,
		});
	}, [community.likesCount, community.userLiked]);

	const likeMutation = useMutation({
		mutationFn: () => toggleCommunityLike(community.slug),
		onMutate: () => {
			const previousState = {
				likesCount: likeState.likesCount,
				userLiked: likeState.userLiked,
			};

			setLikeState((current) => ({
				userLiked: !current.userLiked,
				likesCount: current.likesCount + (current.userLiked ? -1 : 1),
			}));

			return { previousState };
		},
		onError: (_error, _variables, context) => {
			if (context?.previousState) {
				setLikeState(context.previousState);
			}
		},
		onSettled: async () => {
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

	const handleLike = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isSessionLoading || likeMutation.isPending) return;
		if (!session) {
			openAuthPrompt({
				redirectTo: `/comunidades/${community.slug}`,
			});
			return;
		}
		likeMutation.mutate();
	};

	return (
		<div className="glass-panel relative p-5 flex flex-col gap-4 group transition-transform hover:-translate-y-1">
			<RouterLink
				to="/comunidades/$slug"
				params={{ slug: community.slug }}
				className="flex flex-1 flex-col gap-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
			>
				<div className="min-w-0 pr-16">
					<h3 className="text-lg font-bold group-hover:text-brand-primary transition-colors line-clamp-1">
						{community.title}
					</h3>
					<p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
						<Tags className="w-3 h-3" /> {community.category.name}
					</p>
					{communityPlatforms.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{communityPlatforms.slice(0, 5).map((platform) => {
								const meta =
									communityPlatformMeta[platform] ??
									communityPlatformMeta.OUTRA;
								const Icon = meta.Icon;

								return (
									<span
										key={platform}
										title={meta.label}
										className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors group-hover:border-brand-primary/30 group-hover:text-brand-primary"
									>
										<Icon className="h-3.5 w-3.5" />
									</span>
								);
							})}
							{communityPlatforms.length > 5 && (
								<span
									title={`${communityPlatforms.length - 5} canais adicionais`}
									className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-1.5 text-[10px] font-bold text-gray-400"
								>
									+{communityPlatforms.length - 5}
								</span>
							)}
						</div>
					)}
				</div>

				<p className="text-sm text-gray-400 line-clamp-2">
					{community.description}
				</p>

				<div className="flex items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2 mt-auto">
						{community?.tags?.slice(0, 3).map((tag) => (
							<span
								key={tag}
								className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-gray-400"
							>
								#{tag}
							</span>
						))}
					</div>
					<div
						className="flex items-center gap-1 text-xs text-gray-500"
						title={`${community.views} ${community.views === 1 ? "visualização" : "visualizações"}`}
					>
						<Eye className="w-3 h-3" /> {community.views}
					</div>
				</div>
			</RouterLink>
			<button
				type="button"
				title={`${likeState.likesCount} ${likeState.likesCount === 1 ? "curtida" : "curtidas"}`}
				onClick={handleLike}
				disabled={isSessionLoading || likeMutation.isPending}
				className={cn(
					"absolute right-5 top-5 z-10 flex items-center gap-1 transition-all",
					likeState.userLiked
						? "text-red-500"
						: "text-gray-500 hover:text-red-400",
				)}
			>
				<span className="text-xs font-bold">{likeState.likesCount}</span>
				<Heart
					className={cn("w-5 h-5", likeState.userLiked && "fill-current")}
				/>
			</button>
		</div>
	);
}
