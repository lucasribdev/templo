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
	type: ListingType;
	gameId: string;
	userId: string;
	title: string;
	description: string;
	createdAt: string;
	tags: string[];
	views: number;
	ip?: string;
}

export interface ListingRow {
	id: string;
	type: ListingType;
	game_id: string;
	user_id: string;
	title: string;
	description: string;
	created_at: string;
	tags: string[];
	views: number;
	ip?: string;
	discord_invite?: string;
}
