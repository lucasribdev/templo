import type {
	GameRow,
	Listing,
	ListingByIdRpcRow,
	ListingsRpcRow,
	Profile,
	ProfileRow,
	ProfileSummary,
} from "@/types";

function mapListingProfile(
	row: Pick<
		ListingByIdRpcRow | ListingsRpcRow,
		"profile_avatar_url" | "profile_full_name" | "profile_username" | "user_id"
	>,
): ProfileSummary {
	return {
		id: row.user_id,
		username: row.profile_username,
		fullName: row.profile_full_name,
		avatarUrl: row.profile_avatar_url,
	};
}

function mapListingRpcBase(row: ListingByIdRpcRow | ListingsRpcRow): Listing {
	return {
		id: row.id,
		slug: row.slug,
		userId: row.user_id,
		game: {
			id: row.game_id,
			slug: row.game_slug,
			name: row.game_name,
			coverUrl: row.game_cover_url ?? "",
			genres: row.game_genres ?? [],
			releaseDate: row.game_release_date ?? "",
			website: row.game_website ?? "",
			createdAt: row.created_at,
		},
		profile: mapListingProfile(row),
		type: row.type,
		title: row.title,
		description: row.description,
		ip: row.ip,
		tags: row.tags,
		discordInvite: row.discord_invite,
		views: row.views,
		active: row.active,
		likesCount: row.likes_count,
		userLiked: row.user_liked,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function mapListingByIdRpc(row: ListingByIdRpcRow): Listing {
	return mapListingRpcBase(row);
}

export function mapListingsRpc(row: ListingsRpcRow): Listing {
	return mapListingRpcBase(row);
}

export function mapGame(row: GameRow) {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		coverUrl: row.cover_url,
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
