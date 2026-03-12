import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/api/listings/$id")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { data, error } = await supabase
					.from("listings")
					.select("*")
					.eq("id", params.id)
					.single();

				if (error) {
					return Response.json({ error: error.message }, { status: 404 });
				}

				return Response.json(data);
			},
		},
	},
});
