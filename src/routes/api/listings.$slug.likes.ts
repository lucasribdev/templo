import { createFileRoute } from "@tanstack/react-router";
import { createSupabaseUserClient } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings/$slug/likes")({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				const authHeader = request.headers.get("authorization");

				if (!authHeader?.startsWith("Bearer ")) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				const supabase = createSupabaseUserClient(authHeader);
				const { data: authData, error: authError } =
					await supabase.auth.getUser();

				if (authError || !authData.user) {
					return Response.json(
						{
							error: "Unauthorized",
							message: authError?.message ?? "Invalid session",
						},
						{ status: 401 },
					);
				}

				const { data: listing, error: listingError } = await supabase
					.from("listings")
					.select("id")
					.eq("slug", params.slug)
					.maybeSingle();

				if (listingError || !listing) {
					return Response.json(
						{
							error: "Listing not found",
							message: listingError?.message,
						},
						{ status: 404 },
					);
				}

				const { data, error } = await supabase.rpc("toggle_listing_like", {
					p_listing_id: listing.id,
				});

				if (error) {
					return Response.json(
						{
							error: "Failed to toggle listing like",
							message: error.message,
						},
						{ status: 500 },
					);
				}

				return Response.json({ success: true, data });
			},
		},
	},
});
