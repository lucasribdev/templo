import { createFileRoute } from "@tanstack/react-router";
import { mapCategory } from "@/utils/mappers";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/categories/$slug")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { data, error } = await supabase
					.from("categories")
					.select("*")
					.eq("slug", params.slug)
					.maybeSingle();

				if (error) {
					return Response.json(
						{
							error: "Failed to fetch category",
						},
						{ status: 500 },
					);
				}

				if (!data) {
					return Response.json(
						{ error: "Category not found" },
						{ status: 404 },
					);
				}

				return Response.json(mapCategory(data));
			},
		},
	},
});
