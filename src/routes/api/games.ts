import { createFileRoute } from "@tanstack/react-router";
import { mapGame } from "@/utils/mappers";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/games")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const { searchParams } = new URL(request.url);
				const limitParam = searchParams.get("limit");
				const offsetParam = searchParams.get("offset");
				const search = searchParams.get("search")?.trim();

				const limit = limitParam ? Number(limitParam) : undefined;
				const offset = offsetParam ? Number(offsetParam) : 0;

				let query = supabase
					.from("games")
					.select("id, name, cover_url, genres, release_date, website")
					.order("name");

				if (search) {
					query = query.ilike("name", `%${search}%`);
				}

				if (limit !== undefined) {
					query = query.range(offset, offset + limit - 1);
				}

				const { data, error } = await query;

				if (error) {
					return Response.json(
						{ error: "Failed to fetch games" },
						{ status: 500 },
					);
				}

				return Response.json(data.map(mapGame));
			},
		},
	},
});
