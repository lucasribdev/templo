import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings/$slug/views")({
	server: {
		handlers: {
			POST: async ({ params }) => {
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

				const { data, error } = await supabase.rpc("increment_listing_views", {
					p_listing_id: listing.id,
				});

				if (error) {
					return new Response(
						JSON.stringify({ error: "Failed to increment listing views" }),
						{ status: 500 },
					);
				}

				return Response.json({ views: data ?? 0 });
			},
		},
	},
});
