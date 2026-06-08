import { createFileRoute } from "@tanstack/react-router";
import { mapCategory } from "@/utils/mappers";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/categories")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const { searchParams } = new URL(request.url);
				const limitParam = searchParams.get("limit");
				const offsetParam = searchParams.get("offset");
				const search = searchParams.get("search")?.trim();
				const sortBy = searchParams.get("sortBy");

				const limit = limitParam ? Number(limitParam) : undefined;
				const offset = offsetParam ? Number(offsetParam) : 0;

				let query = supabase
					.from("categories")
					.select("id, slug, name, genres, release_date, website, created_at");

				if (sortBy === "ALPHABETICAL") {
					query = query.order("name");
				} else {
					query = query.order("created_at", { ascending: false });
				}

				if (search) {
					query = query.ilike("name", `%${search}%`);
				}

				if (limit !== undefined) {
					query = query.range(offset, offset + limit - 1);
				}

				const { data, error } = await query;

				if (error) {
					return Response.json(
						{ error: "Failed to fetch categories" },
						{ status: 500 },
					);
				}

				return Response.json(data.map(mapCategory));
			},
		},
	},
});
