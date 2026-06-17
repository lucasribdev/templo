import { createFileRoute } from "@tanstack/react-router";
import { mapProfile } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

async function getProfileById(request: Request, id: string) {
	const authHeader = request.headers.get("authorization");
	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;

	const { data: profile, error: profileError } = await supabaseClient
		.from("profiles")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (profileError) {
		return {
			error: Response.json(
				{
					error: "Failed to fetch user profile",
				},
				{ status: 500 },
			),
		};
	}

	if (!profile) {
		return {
			error: Response.json({ error: "Profile not found" }, { status: 404 }),
		};
	}

	return {
		data: mapProfile(profile),
	};
}

export const Route = createFileRoute("/api/profile-by-id/$id")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const result = await getProfileById(request, params.id);
				if (result.error) {
					return result.error;
				}

				return Response.json(result.data);
			},
		},
	},
});
