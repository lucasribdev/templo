import { createFileRoute } from "@tanstack/react-router";
import { trackCommunityLinkClickHandler } from "@/utils/community-api-handlers";

export const Route = createFileRoute("/api/community-links/$id/clicks")({
	server: {
		handlers: {
			POST: trackCommunityLinkClickHandler,
		},
	},
});
