import type { ListingRow } from "@/types";

export function mapListing(row: ListingRow) {
	return {
		...row,
		gameId: row.game_id,
		userId: row.user_id,
		discordInvite: row.discord_invite,
		createdAt: row.created_at,
	};
}
