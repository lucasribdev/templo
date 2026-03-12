import type { s } from "node_modules/vite/dist/node/chunks/moduleRunnerTransport";

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
	gameId: string;
	gameName: string;
	game: Game;
	type: ListingType;
	title: string;
	description?: string;
	ip?: string;
	tags?: string[];
	discordInvite?: string;
	views: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ListingRow {
	id: string;
	user_id: string;
	game_id: string;
	game_name: string;
	game?: GameRow | null;
	type: ListingType;
	title: string;
	description?: string;
	ip?: string;
	tags?: string[];
	discord_invite?: string;
	views: number;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Profile {
	id: string;
	username: string;
	fullName: string;
	avatarUrl: string;
	bio: string;
	discordId: string;
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
	gameId: string;
	type: ListingType;
	title: string;
	description: string;
	discordInvite: string;
	ip?: string;
	tags: string[];
}
