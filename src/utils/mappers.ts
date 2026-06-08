import type {
	CategoryRow,
	CommunitiesRpcRow,
	Community,
	CommunityByIdRpcRow,
	CommunityLink,
	CommunityLinkRow,
	Profile,
	ProfileRow,
	ProfileSummary,
} from "@/types";

function mapCommunityProfile(
	row: Pick<
		CommunityByIdRpcRow | CommunitiesRpcRow,
		| "profile_avatar_url"
		| "profile_full_name"
		| "profile_username"
		| "profile_created_at"
		| "user_id"
	>,
): ProfileSummary {
	return {
		id: row.user_id,
		username: row.profile_username,
		fullName: row.profile_full_name,
		avatarUrl: row.profile_avatar_url,
		createdAt: row.profile_created_at,
	};
}

export function mapCommunityLink(row: CommunityLinkRow): CommunityLink {
	return {
		id: row.id,
		communityId: row.community_id,
		platform: row.platform,
		url: row.url,
		position: row.position,
		clicksCount: row.clicks_count,
		label: row.label,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function mapCommunityRpcBase(
	row: CommunityByIdRpcRow | CommunitiesRpcRow,
): Community {
	return {
		id: row.id,
		slug: row.slug,
		userId: row.user_id,
		category: {
			id: row.category_id,
			slug: row.category_slug,
			name: row.category_name,
			genres: row.category_genres ?? [],
			releaseDate: row.category_release_date ?? "",
			website: row.category_website ?? "",
			createdAt: row.created_at,
		},
		profile: mapCommunityProfile(row),
		title: row.title,
		description: row.description,
		tags: row.tags,
		links: (row.links ?? []).map(mapCommunityLink),
		views: row.views,
		active: row.active,
		likesCount: row.likes_count,
		userLiked: row.user_liked,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function mapCommunityByIdRpc(row: CommunityByIdRpcRow): Community {
	return mapCommunityRpcBase(row);
}

export function mapCommunitiesRpc(row: CommunitiesRpcRow): Community {
	return mapCommunityRpcBase(row);
}

export function mapCategory(row: CategoryRow) {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		genres: row.genres ?? [],
		releaseDate: row.release_date,
		website: row.website,
		createdAt: row.created_at,
	};
}

export function mapProfile(row: ProfileRow): Profile {
	return {
		id: row.id,
		username: row.username,
		fullName: row.full_name,
		avatarUrl: row.avatar_url,
		bio: row.bio,
		discordId: row.discord_id,
		likesCount: 0,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}
