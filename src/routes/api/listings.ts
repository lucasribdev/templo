import { createFileRoute } from "@tanstack/react-router";
import { title } from "process";
import { mapListing } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings")({
	server: {
		handlers: {
			GET: async () => {
				const { data, error } = await supabase
					.from("listings")
					.select("*")
					.eq("active", true)
					.order("created_at", { ascending: false });

				if (error) {
					return Response.json({ error: error.message }, { status: 500 });
				}

				return Response.json(data.map(mapListing));
			},
			POST: async ({ request }) => {
				const authHeader = request.headers.get("authorization");

				if (!authHeader) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				const body = await request.json();

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
						discord_invite: body.discordInvite,
						ip: body.ip,
						active: true,
					})
					.select()
					.single();

				if (error) {
					return Response.json({ error: error.message }, { status: 500 });
				}

				return Response.json(data, { status: 201 });
			},
		},
	},
});
