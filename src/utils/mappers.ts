import type {
	GameRow,
	ListingByIdRpcRow,
	ListingsRpcRow,
	ProfileRow,
} from "@/types";

export function mapListingByIdRpc(row: ListingByIdRpcRow) {
	return {
		id: row.id,
		game: {
			id: row.game_id,
			name: row.game_name,
			coverUrl: row.game_cover_url ?? "",
			genres: row.game_genres ?? [],
			releaseDate: row.game_release_date ?? "",
			website: row.game_website ?? "",
		},
		profile: {
			id: row.user_id,
			username: row.profile_username,
			fullName: row.profile_full_name,
			avatarUrl: row.profile_avatar_url,
		},
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

export function mapListingsRpc(row: ListingsRpcRow) {
	return {
		id: row.id,
		game: {
			id: row.game_id,
			name: row.game_name,
			coverUrl: row.game_cover_url ?? "",
			genres: row.game_genres ?? [],
			releaseDate: row.game_release_date ?? "",
			website: row.game_website ?? "",
		},
		profile: {
			id: row.user_id,
			username: row.profile_username,
			fullName: row.profile_full_name,
			avatarUrl: row.profile_avatar_url,
		},
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

export function mapGame(row: GameRow) {
	return {
		id: row.id,
		name: row.name,
		coverUrl: row.cover_url,
		genres: row.genres ?? [],
		releaseDate: row.release_date,
		website: row.website,
	};
}

export function mapProfile(row: ProfileRow) {
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
