import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/games/$id")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { data, error } = await supabase
					.from("games")
					.select("*")
					.eq("id", params.id)
					.single();

				if (error) {
					return Response.json(
						{
							error: "Failed to fetch game",
						},
						{ status: 500 },
					);
				}

				return Response.json(data);
			},
		},
	},
});
