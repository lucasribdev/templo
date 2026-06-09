import { createServerFn } from "@tanstack/react-start";
import type { CommunityByIdRpcRow } from "@/types";
import { mapCategory, mapCommunityByIdRpc, mapProfile } from "@/utils/mappers";
import { supabase } from "@/utils/supabase";

export const getCategoryPageData = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug.trim())
	.handler(async ({ data: slug }) => {
		const { data, error } = await supabase
			.from("categories")
			.select("id, slug, name, created_at")
			.eq("slug", slug)
			.maybeSingle();

		if (error || !data) {
			return null;
		}

		return mapCategory(data);
	});

export const getCommunityPageData = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug.trim())
	.handler(async ({ data: slug }) => {
		const { data, error } = await supabase
			.rpc("get_community_by_slug", {
				p_community_slug: slug,
			})
			.maybeSingle();

		if (error || !data) {
			return null;
		}

		return mapCommunityByIdRpc(data as CommunityByIdRpcRow);
	});

export const getProfilePageData = createServerFn({
	method: "GET",
})
	.inputValidator((profileFullName: string) => profileFullName.trim())
	.handler(async ({ data: profileFullName }) => {
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("full_name", profileFullName)
			.maybeSingle();

		if (profileError || !profile) {
			return null;
		}

		const { count: likesCount, error: likesError } = await supabase
			.from("community_likes")
			.select("*", { count: "exact", head: true })
			.eq("user_id", profile.id);

		if (likesError) {
			return null;
		}

		return {
			...mapProfile(profile),
			likesCount: likesCount ?? 0,
		};
	});
