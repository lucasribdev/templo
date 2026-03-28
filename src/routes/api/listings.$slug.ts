import { createFileRoute } from "@tanstack/react-router";
import type { ListingByIdRpcRow } from "@/types";
import { mapListingByIdRpc } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings/$slug")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const authHeader = request.headers.get("authorization");
				const supabaseClient = authHeader
					? createSupabaseUserClient(authHeader)
					: supabase;
				const { data, error } = await supabaseClient
					.rpc("get_listing_by_slug", {
						p_listing_slug: params.slug,
					})
					.maybeSingle();

				if (error) {
					return Response.json(
						{ error: "Failed to fetch listing" },
						{ status: 500 },
					);
				}

				if (!data) {
					return Response.json({ error: "Listing not found" }, { status: 404 });
				}

				return Response.json(mapListingByIdRpc(data as ListingByIdRpcRow));
			},
		},
	},
});
