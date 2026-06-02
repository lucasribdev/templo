import { createFileRoute } from "@tanstack/react-router";
import { getLikedCommunitiesHandler } from "@/utils/community-api-handlers";

export const Route = createFileRoute("/api/users/$id/liked-communities")({
	server: {
		handlers: {
			GET: getLikedCommunitiesHandler,
		},
	},
});
