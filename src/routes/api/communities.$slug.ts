import { createFileRoute } from "@tanstack/react-router";
import { getCommunityBySlugHandler } from "@/utils/community-api-handlers";

export const Route = createFileRoute("/api/communities/$slug")({
	server: {
		handlers: {
			GET: getCommunityBySlugHandler,
		},
	},
});
