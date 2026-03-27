export type ListingType = "LFG" | "SERVER" | "COMMUNITY";

export interface Game {
	id: string;
	name: string;
	coverUrl: string;
	genres: string[];
	releaseDate: string;
	website: string;
}

export interface GameRow {
	id: string;
	name: string;
	cover_url: string;
	genres: string[];
	release_date: string;
	website: string;
}

export interface Listing {
	id: string;
	userId: string;
	game: Game;
	profile: Profile;
	type: ListingType;
	title: string;
	description?: string;
	ip?: string;
	tags?: string[];
	discordInvite?: string;
	views: number;
	active: boolean;
	likesCount: number;
	userLiked: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ListingByIdRpcRow {
	id: string;
	user_id: string;
	game_id: string;
	game_name: string;
	game_cover_url?: string;
	game_genres?: string[];
	game_release_date?: string;
	game_website?: string;
	type: ListingType;
	title: string;
	description?: string;
	ip?: string;
	tags?: string[];
	discord_invite?: string;
	views: number;
	active: boolean;
	likes_count: number;
	user_liked: boolean;
	created_at: string;
	updated_at: string;
	profile_username: string;
	profile_full_name: string;
	profile_avatar_url: string;
}

export interface ListingsRpcRow {
	id: string;
	user_id: string;
	game_id: string;
	game_name: string;
	type: ListingType;
	title: string;
	description?: string;
	ip?: string;
	tags?: string[];
	discord_invite?: string;
	views: number;
	active: boolean;
	likes_count: number;
	user_liked: boolean;
	created_at: string;
	updated_at: string;
	game_cover_url?: string;
	game_genres?: string[];
	game_release_date?: string;
	game_website?: string;
	profile_username: string;
	profile_full_name: string;
	profile_avatar_url: string;
}

export interface Profile {
	id: string;
	username: string;
	fullName: string;
	avatarUrl: string;
	bio: string;
	discordId: string;
	likesCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface ProfileRow {
	id: string;
	username: string;
	full_name: string;
	avatar_url: string;
	bio: string;
	discord_id: string;
	created_at: string;
	updated_at: string;
}

export interface CreateListingInput {
	gameId?: string;
	suggestedGameName?: string;
	type: ListingType;
	title: string;
	description: string;
	discordInvite: string;
	ip?: string;
	tags: string[];
}

export interface ListingLikes {
	id: string;
	listingId: string;
	userId: string;
	createdAt: string;
}

export interface ListingLikesRow {
	id: string;
	listing_id: string;
	user_id: string;
	created_at: string;
}

export interface ListingLikeCount {
	count: number;
}

export interface ListingLikeUser {
	user_id: string;
}

export interface GetGamesParams {
	signal?: AbortSignal;
	limit?: number;
	offset?: number;
	search?: string;
}
