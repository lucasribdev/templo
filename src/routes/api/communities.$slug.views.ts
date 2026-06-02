import { createFileRoute } from "@tanstack/react-router";
import { trackCommunityViewHandler } from "@/utils/community-api-handlers";

export const Route = createFileRoute("/api/communities/$slug/views")({
	server: {
		handlers: {
			POST: trackCommunityViewHandler,
		},
	},
});
