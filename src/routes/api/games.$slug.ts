import { createFileRoute } from "@tanstack/react-router";
import { mapGame } from "@/utils/mappers";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/games/$slug")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { data, error } = await supabase
					.from("games")
					.select("*")
					.eq("slug", params.slug)
					.maybeSingle();

				if (error) {
					return Response.json(
						{
							error: "Failed to fetch game",
						},
						{ status: 500 },
					);
				}

				if (!data) {
					return Response.json({ error: "Game not found" }, { status: 404 });
				}

				return Response.json(mapGame(data));
			},
		},
	},
});
