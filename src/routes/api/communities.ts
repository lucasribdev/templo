import { createFileRoute } from "@tanstack/react-router";
import {
	createCommunityHandler,
	getCommunitiesHandler,
} from "@/utils/community-api-handlers";

export const Route = createFileRoute("/api/communities")({
	server: {
		handlers: {
			GET: getCommunitiesHandler,
			POST: createCommunityHandler,
		},
	},
});
