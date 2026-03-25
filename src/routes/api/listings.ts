import { createFileRoute } from "@tanstack/react-router";
import type { ListingByIdRpcRow, ListingsRpcRow } from "@/types";
import { normalizeDiscordInvite } from "@/utils/discord";
import { mapListingByIdRpc, mapListingsRpc } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);

				const gameId = url.searchParams.get("gameId");
				const userId = url.searchParams.get("userId");
				const limit = Number(url.searchParams.get("limit") ?? 12);
				const offset = Number(url.searchParams.get("offset") ?? 0);

				const authHeader = request.headers.get("authorization");
				const supabaseClient = authHeader
					? createSupabaseUserClient(authHeader)
					: supabase;
				const { data, error } = await supabaseClient.rpc("get_listings", {
					p_game_id: gameId,
					p_user_id: userId,
					p_limit: limit,
					p_offset: offset,
				});

				if (error) {
					return Response.json(
						{
							error: "Failed to fetch listings",
						},
						{ status: 500 },
					);
				}

				const listings = (data ?? []) as ListingsRpcRow[];

				return Response.json(listings.map(mapListingsRpc));
			},
			POST: async ({ request }) => {
				const authHeader = request.headers.get("authorization");

				if (!authHeader) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				const body = await request.json();
				const discordInvite = normalizeDiscordInvite(body.discordInvite ?? "");

				if (!discordInvite) {
					return Response.json(
						{ error: "Discord invite must be a valid Discord URL" },
						{ status: 400 },
					);
				}

				const supabaseUser = createSupabaseUserClient(authHeader);
				const { data: authData } = await supabaseUser.auth.getUser();

				if (!authData.user) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				const { data, error } = await supabaseUser
					.from("listings")
					.insert({
						user_id: authData.user.id,
						game_id: body.gameId,
						type: body.type,
						title: body.title,
						description: body.description,
						tags: body.tags,
						discord_invite: discordInvite,
						ip: body.ip,
						active: true,
					})
					.select()
					.single();

				if (error) {
					return Response.json({ error: error.message }, { status: 500 });
				}

				const { data: createdListing, error: createdListingError } =
					await supabaseUser
						.rpc("get_listing_by_id", {
							p_listing_id: data.id,
						})
						.maybeSingle();

				if (createdListingError || !createdListing) {
					return Response.json(
						{
							error: "Failed to fetch created listing",
							message: createdListingError?.message,
						},
						{ status: 500 },
					);
				}

				return Response.json(
					mapListingByIdRpc(createdListing as ListingByIdRpcRow),
					{ status: 201 },
				);
			},
		},
	},
});
