import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Heart, Tags } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import { useAuth } from "@/hooks/use-auth";
import { toggleCommunityLike } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Community } from "@/types";

export default function CommunityCard({ community }: { community: Community }) {
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

	return (
		<motion.div
			whileHover={{ y: -4 }}
			className="glass-panel p-5 flex flex-col gap-4 cursor-pointer group"
			onClick={() =>
				navigate({ to: "/comunidades/$slug", params: { slug: community.slug } })
			}
		>
			<div className="flex justify-between items-start">
				<div>
					<h3 className="text-lg font-bold group-hover:text-brand-primary transition-colors line-clamp-1">
						{community.title}
					</h3>
					<p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
						<Tags className="w-3 h-3" /> {community.category.name}
					</p>
				</div>
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

			<p className="text-sm text-gray-400 line-clamp-2">
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

			<div className="flex items-center gap-3">
				<div
					className="flex items-center gap-1 text-xs text-gray-500"
					title={`${community.views} ${community.views === 1 ? "visualização" : "visualizações"}`}
				>
					<Eye className="w-3 h-3" /> {community.views}
				</div>
			</div>
		</motion.div>
	);
}
