import type { GameRow, ListingRow, ProfileRow } from "@/types";

export function mapListing(row: ListingRow) {
	return {
		id: row.id,
		gameId: row.game_id,
		userId: row.user_id,
		gameName: row.game_name,
		game: row.game ? mapGame(row.game) : undefined,
		type: row.type,
		title: row.title,
		description: row.description,
		ip: row.ip,
		tags: row.tags,
		discordInvite: row.discord_invite,
		views: row.views,
		active: row.active,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function mapGame(row: GameRow) {
	return {
		id: row.id,
		name: row.name,
		coverUrl: row.cover_url,
		genres: row.genres,
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
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}
