import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Eye, Gamepad2, Heart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { toggleCommunityLike } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Community, DiscordInviteStats } from "@/types";
import { formatPostedAt } from "@/utils/date";

export default function CommunityCard({
	discordStats,
	community,
}: {
	discordStats?: DiscordInviteStats;
	community: Community;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { session, isSessionLoading } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();
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
				title: "Curtir comunidade",
				description:
					"Entre ou cadastre-se com Discord para curtir comunidades.",
				redirectTo: `/comunidades/${community.slug}`,
			});
			return;
		}
		likeMutation.mutate();
	};

	const handleProfileClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigate({
			to: "/profile/$profileFullName",
			params: { profileFullName: community.profile.fullName },
		});
	};

	return (
		<motion.div
			whileHover={{ y: -4 }}
			className="glass-panel p-5 flex flex-col gap-4 cursor-pointer group"
			onClick={() =>
				navigate({ to: "/comunidades/$slug", params: { slug: community.slug } })
			}
		>
			<div className="flex justify-between items-start">
				<p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
					<Gamepad2 className="w-3 h-3" /> {community.game.name}
				</p>
				<button
					type="button"
					title={`${likeState.likesCount} ${likeState.likesCount === 1 ? "curtida" : "curtidas"}`}
					onClick={handleLike}
					disabled={isSessionLoading || likeMutation.isPending}
					className={cn(
						"flex items-center gap-1 transition-all",
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

			<div>
				<h3 className="text-lg font-bold group-hover:text-brand-primary transition-colors line-clamp-1">
					{community.title}
				</h3>
			</div>

			<p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
				{community.description}
			</p>

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

			<div className="pt-4 border-t border-border-dark flex justify-between items-center">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleProfileClick}
						className="flex items-center gap-1.5 rounded-sm transition-colors hover:text-brand-primary"
					>
						<UserAvatar
							avatarUrl={community.profile.avatarUrl}
							className="w-6 h-6 shrink-0 rounded-full object-cover border border-white/10"
							name={community.profile.fullName}
						/>
						<span className="text-xs text-gray-500">
							{community.profile?.fullName}
						</span>
					</button>
					<div className="flex items-center gap-1 text-xs text-gray-500">
						<Clock className="w-3 h-3" /> {formatPostedAt(community.createdAt)}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div
						className="flex min-w-[74px] items-center gap-1 text-xs text-gray-500"
						title={
							discordStats?.approximatePresenceCount !== null &&
							discordStats?.approximatePresenceCount !== undefined
								? `${discordStats.approximatePresenceCount} online agora no Discord`
								: "Carregando jogadores online no Discord"
						}
					>
						<span
							className={cn(
								"size-2 rounded-full",
								discordStats?.approximatePresenceCount === null ||
									discordStats?.approximatePresenceCount === undefined
									? "bg-gray-600"
									: "bg-brand-primary",
							)}
						/>
						{discordStats?.approximatePresenceCount ?? "--"} online
					</div>
					<div
						className="flex items-center gap-1 text-xs text-gray-500"
						title={`${community.views} ${community.views === 1 ? "visualização" : "visualizações"}`}
					>
						<Eye className="w-3 h-3" /> {community.views}
					</div>
				</div>
			</div>
		</motion.div>
	);
}
