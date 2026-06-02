import { createServerFn } from "@tanstack/react-start";
import type { ListingByIdRpcRow } from "@/types";
import { mapGame, mapListingByIdRpc, mapProfile } from "@/utils/mappers";
import { supabase } from "@/utils/supabase";

export const getGamePageData = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug.trim())
	.handler(async ({ data: slug }) => {
		const { data, error } = await supabase
			.from("games")
			.select("*")
			.eq("slug", slug)
			.maybeSingle();

		if (error || !data) {
			return null;
		}

		return mapGame(data);
	});

export const getListingPageData = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug.trim())
	.handler(async ({ data: slug }) => {
		const { data, error } = await supabase
			.rpc("get_listing_by_slug", {
				p_listing_slug: slug,
			})
			.maybeSingle();

		if (error || !data) {
			return null;
		}

		return mapListingByIdRpc(data as ListingByIdRpcRow);
	});

export const getCommunityPageData = getListingPageData;

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
			.from("listing_likes")
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
