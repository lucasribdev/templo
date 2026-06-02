import type {
	CommunitiesRpcRow,
	CommunityByIdRpcRow,
	CommunityLikesRow,
} from "@/types";
import { normalizeDiscordInvite } from "@/utils/discord";
import { mapCommunitiesRpc, mapCommunityByIdRpc } from "@/utils/mappers";
import { createSupabaseUserClient, supabase } from "@/utils/supabase";

function normalizeVisitorId(value: string | null) {
	if (!value) {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	return trimmedValue.slice(0, 128);
}

export async function getCommunitiesHandler({ request }: { request: Request }) {
	const url = new URL(request.url);

	const categoryId = url.searchParams.get("categoryId");
	const userId = url.searchParams.get("userId");
	const search = url.searchParams.get("search")?.trim();
	const sortBy = url.searchParams.get("sortBy")?.trim().toUpperCase();

	const limit = Number(url.searchParams.get("limit") ?? 12);
	const offset = Number(url.searchParams.get("offset") ?? 0);

	const authHeader = request.headers.get("authorization");
	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;
	const { data, error } = await supabaseClient.rpc("get_communities", {
		p_category_id: categoryId,
		p_user_id: userId,
		p_search: search || null,
		p_sort_by: sortBy || "DATE",
		p_limit: limit,
		p_offset: offset,
	});

	if (error) {
		return Response.json(
			{
				error: "Failed to fetch communities",
			},
			{ status: 500 },
		);
	}

	const communities = (data ?? []) as CommunitiesRpcRow[];

	return Response.json(communities.map(mapCommunitiesRpc));
}

export async function createCommunityHandler({
	request,
}: {
	request: Request;
}) {
	const authHeader = request.headers.get("authorization");

	if (!authHeader) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const discordInvite = normalizeDiscordInvite(body.discordInvite ?? "");
	const suggestedCategoryName = String(body.suggestedCategoryName ?? "").trim();

	if (!discordInvite) {
		return Response.json(
			{ error: "Discord invite must be a valid Discord URL" },
			{ status: 400 },
		);
	}

	if (!body.categoryId && !suggestedCategoryName) {
		return Response.json({ error: "Category is required" }, { status: 400 });
	}

	const supabaseUser = createSupabaseUserClient(authHeader);
	const { data: authData } = await supabaseUser.auth.getUser();

	if (!authData.user) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let categoryId = String(body.categoryId ?? "").trim();

	if (!categoryId && suggestedCategoryName) {
		const { data: resolvedCategoryId, error: resolvedCategoryError } =
			await supabaseUser.rpc("get_or_create_manual_category", {
				p_name: suggestedCategoryName,
			});

		if (resolvedCategoryError || !resolvedCategoryId) {
			return Response.json(
				{
					error: "Failed to resolve suggested category",
					message: resolvedCategoryError?.message,
				},
				{ status: 500 },
			);
		}

		categoryId = resolvedCategoryId;
	}

	const { data, error } = await supabaseUser
		.from("communities")
		.insert({
			user_id: authData.user.id,
			category_id: categoryId,
			title: body.title,
			description: body.description,
			tags: body.tags,
			discord_invite: discordInvite,
			active: true,
		})
		.select()
		.single();

	if (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}

	const { data: createdCommunity, error: createdCommunityError } =
		await supabaseUser
			.rpc("get_community_by_id", {
				p_community_id: data.id,
			})
			.maybeSingle();

	if (createdCommunityError || !createdCommunity) {
		return Response.json(
			{
				error: "Failed to fetch created community",
				message: createdCommunityError?.message,
			},
			{ status: 500 },
		);
	}

	return Response.json(
		mapCommunityByIdRpc(createdCommunity as CommunityByIdRpcRow),
		{ status: 201 },
	);
}

export async function getCommunityBySlugHandler({
	params,
	request,
}: {
	params: { slug: string };
	request: Request;
}) {
	const authHeader = request.headers.get("authorization");
	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;
	const { data, error } = await supabaseClient
		.rpc("get_community_by_slug", {
			p_community_slug: params.slug,
		})
		.maybeSingle();

	if (error) {
		return Response.json(
			{ error: "Failed to fetch community" },
			{ status: 500 },
		);
	}

	if (!data) {
		return Response.json({ error: "Community not found" }, { status: 404 });
	}

	return Response.json(mapCommunityByIdRpc(data as CommunityByIdRpcRow));
}

export async function toggleCommunityLikeHandler({
	params,
	request,
}: {
	params: { slug: string };
	request: Request;
}) {
	const authHeader = request.headers.get("authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const supabaseUser = createSupabaseUserClient(authHeader);
	const { data: authData, error: authError } =
		await supabaseUser.auth.getUser();

	if (authError || !authData.user) {
		return Response.json(
			{
				error: "Unauthorized",
				message: authError?.message ?? "Invalid session",
			},
			{ status: 401 },
		);
	}

	const { data: community, error: communityError } = await supabaseUser
		.from("communities")
		.select("id")
		.eq("slug", params.slug)
		.maybeSingle();

	if (communityError || !community) {
		return Response.json(
			{
				error: "Community not found",
				message: communityError?.message,
			},
			{ status: 404 },
		);
	}

	const { data, error } = await supabaseUser.rpc("toggle_community_like", {
		p_community_id: community.id,
	});

	if (error) {
		return Response.json(
			{
				error: "Failed to toggle community like",
				message: error.message,
			},
			{ status: 500 },
		);
	}

	return Response.json({ success: true, data });
}

export async function trackCommunityViewHandler({
	params,
	request,
}: {
	params: { slug: string };
	request: Request;
}) {
	const { data: community, error: communityError } = await supabase
		.from("communities")
		.select("id")
		.eq("slug", params.slug)
		.maybeSingle();

	if (communityError || !community) {
		return new Response(JSON.stringify({ error: "Community not found" }), {
			status: 404,
		});
	}

	const authHeader = request.headers.get("authorization");
	const visitorId = normalizeVisitorId(request.headers.get("x-visitor-id"));
	const userAgent = request.headers.get("user-agent");

	let viewerId: string | null = null;

	if (authHeader) {
		const supabaseUser = createSupabaseUserClient(authHeader);
		const { data: authData } = await supabaseUser.auth.getUser();
		viewerId = authData.user?.id ?? null;
	}

	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;
	const { data, error } = await supabaseClient.rpc("track_community_view", {
		p_community_id: community.id,
		p_viewer_id: viewerId,
		p_visitor_id: visitorId,
		p_user_agent: userAgent,
	});

	if (error) {
		return new Response(
			JSON.stringify({ error: "Failed to track community views" }),
			{ status: 500 },
		);
	}

	return Response.json({ views: data ?? 0 });
}

export async function getLikedCommunitiesHandler({
	params,
	request,
}: {
	params: { id: string };
	request: Request;
}) {
	const url = new URL(request.url);
	const limit = Number(url.searchParams.get("limit") ?? 12);
	const offset = Number(url.searchParams.get("offset") ?? 0);

	const authHeader = request.headers.get("authorization");
	const supabaseClient = authHeader
		? createSupabaseUserClient(authHeader)
		: supabase;

	const { data: likes, error: likesError } = await supabaseClient
		.from("community_likes")
		.select("community_id, created_at")
		.eq("user_id", params.id)
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (likesError) {
		return Response.json(
			{ error: "Failed to fetch liked communities" },
			{ status: 500 },
		);
	}

	const likedCommunities = (likes ?? []) as Pick<
		CommunityLikesRow,
		"community_id" | "created_at"
	>[];

	if (likedCommunities.length === 0) {
		return Response.json([]);
	}

	const communityResults = await Promise.all(
		likedCommunities.map(async ({ community_id }) => {
			const { data, error } = await supabaseClient
				.rpc("get_community_by_id", {
					p_community_id: community_id,
				})
				.maybeSingle();

			if (error || !data) {
				throw new Error(error?.message ?? "Community not found");
			}

			return mapCommunityByIdRpc(data as CommunityByIdRpcRow);
		}),
	);

	return Response.json(communityResults);
}
