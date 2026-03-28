import { createFileRoute } from "@tanstack/react-router";
import type { ListingByIdRpcRow, ListingsRpcRow } from "@/types";
import { normalizeDiscordInvite } from "@/utils/discord";
import { mapListingByIdRpc, mapListingsRpc } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

const MANUAL_GAME_COVER_URL = "/logo512.png";

export const Route = createFileRoute("/api/listings")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);

				const gameId = url.searchParams.get("gameId");
				const userId = url.searchParams.get("userId");
				const search = url.searchParams.get("search")?.trim();
				const type = url.searchParams.get("type");
				const sortBy = url.searchParams.get("sortBy")?.trim().toUpperCase();

				const limit = Number(url.searchParams.get("limit") ?? 12);
				const offset = Number(url.searchParams.get("offset") ?? 0);

				const authHeader = request.headers.get("authorization");
				const supabaseClient = authHeader
					? createSupabaseUserClient(authHeader)
					: supabase;
				const { data, error } = await supabaseClient.rpc("get_listings", {
					p_game_id: gameId,
					p_user_id: userId,
					p_search: search || null,
					p_type: type || null,
					p_sort_by: sortBy || "DATE",
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
				const suggestedGameName = String(body.suggestedGameName ?? "").trim();

				if (!discordInvite) {
					return Response.json(
						{ error: "Discord invite must be a valid Discord URL" },
						{ status: 400 },
					);
				}

				if (!body.gameId && !suggestedGameName) {
					return Response.json({ error: "Game is required" }, { status: 400 });
				}

				const supabaseUser = createSupabaseUserClient(authHeader);
				const { data: authData } = await supabaseUser.auth.getUser();

				if (!authData.user) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				let gameId = String(body.gameId ?? "").trim();

				if (!gameId && suggestedGameName) {
					const { data: resolvedGameId, error: resolvedGameError } =
						await supabaseUser.rpc("get_or_create_manual_game", {
							p_name: suggestedGameName,
							p_cover_url: MANUAL_GAME_COVER_URL,
						});

					if (resolvedGameError || !resolvedGameId) {
						return Response.json(
							{
								error: "Failed to resolve suggested game",
								message: resolvedGameError?.message,
							},
							{ status: 500 },
						);
					}

					gameId = resolvedGameId;
				}

				const { data, error } = await supabaseUser
					.from("listings")
					.insert({
						user_id: authData.user.id,
						game_id: gameId,
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
