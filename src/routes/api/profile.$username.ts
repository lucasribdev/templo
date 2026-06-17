import { createFileRoute } from "@tanstack/react-router";
import { mapProfile } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

async function getProfileByUsername(request: Request, username: string) {
	const authHeader = request.headers.get("authorization");
	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;

	const { data: profile, error: profileError } = await supabaseClient
		.from("profiles")
		.select("*")
		.eq("username", username)
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

	const { count: likesCount, error: likesError } = await supabaseClient
		.from("community_likes")
		.select("*", { count: "exact", head: true })
		.eq("user_id", profile.id);

	if (likesError) {
		return {
			error: Response.json(
				{
					error: "Failed to fetch profile likes",
					message: likesError.message,
				},
				{ status: 500 },
			),
		};
	}

	return {
		data: {
			...mapProfile(profile),
			likesCount: likesCount ?? 0,
		},
	};
}

export const Route = createFileRoute("/api/profile/$username")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const result = await getProfileByUsername(request, params.username);
				if (result.error) {
					return result.error;
				}

				return Response.json(result.data);
			},
		},
	},
});
