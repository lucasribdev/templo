export type ListingType = "LFG" | "SERVER" | "COMMUNITY";

export interface Game {
	id: string;
	name: string;
	image: string;
	tags: string[];
	released: string | null;
	website: string;
}

export interface User {
	id: string;
	name: string;
	avatar: string;
	favorites: string[]; // IDs of listings
	likedListings: string[]; // IDs of listings the user liked
}

export interface Listing {
	id: string;
	userId: string;
	gameId: string;
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
