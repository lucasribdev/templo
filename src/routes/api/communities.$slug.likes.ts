import { createFileRoute } from "@tanstack/react-router";
import { toggleCommunityLikeHandler } from "@/utils/community-api-handlers";

export const Route = createFileRoute("/api/communities/$slug/likes")({
	server: {
		handlers: {
			POST: toggleCommunityLikeHandler,
		},
	},
});
