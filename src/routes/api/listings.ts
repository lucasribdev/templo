import { createFileRoute } from "@tanstack/react-router";
import { normalizeDiscordInvite } from "@/utils/discord";
import { mapListing } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const gameId = url.searchParams.get("gameId");

				let query = supabase
					.from("listings")
					.select("*, game:games(*)")
					.eq("active", true)
					.order("created_at", { ascending: false });

				if (gameId) {
					query = query.eq("game_id", gameId);
				}

				const { data, error } = await query;

				if (error) {
					return Response.json(
						{
							error: "Failed to fetch listings",
						},
						{ status: 500 },
					);
				}

				return Response.json(data.map(mapListing));
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

				return Response.json(mapListing(data), { status: 201 });
			},
		},
	},
});
