import { createFileRoute } from "@tanstack/react-router";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

function normalizeVisitorId(value: string | null) {
	if (!value) {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	return trimmedValue.slice(0, 128);
}

export const Route = createFileRoute("/api/listings/$slug/views")({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				const { data: listing, error: listingError } = await supabase
					.from("listings")
					.select("id")
					.eq("slug", params.slug)
					.maybeSingle();

				if (listingError || !listing) {
					return new Response(JSON.stringify({ error: "Listing not found" }), {
						status: 404,
					});
				}

				const authHeader = request.headers.get("authorization");
				const visitorId = normalizeVisitorId(
					request.headers.get("x-visitor-id"),
				);
				const userAgent = request.headers.get("user-agent");

				let viewerId: string | null = null;

				if (authHeader) {
					const supabaseUser = createSupabaseUserClient(authHeader);
					const { data: authData } = await supabaseUser.auth.getUser();
					viewerId = authData.user?.id ?? null;
				}

				const supabaseClient = authHeader
					? createSupabaseUserClient(authHeader)
					: supabase;
				const { data, error } = await supabaseClient.rpc("track_listing_view", {
					p_listing_id: listing.id,
					p_viewer_id: viewerId,
					p_visitor_id: visitorId,
					p_user_agent: userAgent,
				});

				if (error) {
					return new Response(
						JSON.stringify({ error: "Failed to track listing views" }),
						{ status: 500 },
					);
				}

				return Response.json({ views: data ?? 0 });
			},
		},
	},
});
