import { createFileRoute } from "@tanstack/react-router";
import { mapProfile } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

async function getProfileByProfileFullName(
	request: Request,
	profileFullName: string,
) {
	const authHeader = request.headers.get("authorization");
	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;

	const { data: profile, error: profileError } = await supabaseClient
		.from("profiles")
		.select("*")
		.eq("full_name", profileFullName)
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
		.from("listing_likes")
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

export const Route = createFileRoute("/api/profile/$profileFullName")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const result = await getProfileByProfileFullName(
					request,
					params.profileFullName,
				);
				if (result.error) {
					return result.error;
				}

				return Response.json(result.data);
			},
		},
	},
});
