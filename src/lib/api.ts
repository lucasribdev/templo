import type {
	CreateListingInput,
	Game,
	GetGamesParams,
	GetListingsParams,
	Listing,
	Profile,
} from "@/types";
import { supabase } from "@/utils/supabase";

async function getAuthHeaders() {
	const { data } = await supabase.auth.getSession();
	const accessToken = data.session?.access_token;

	return accessToken
		? {
				Authorization: `Bearer ${accessToken}`,
			}
		: undefined;
}

export async function getGames({
	signal,
	limit,
	offset,
	search,
}: GetGamesParams): Promise<Game[]> {
	const url = new URL("/api/games", window.location.origin);

	if (limit) {
		url.searchParams.set("limit", String(limit));
	}

	if (offset) {
		url.searchParams.set("offset", String(offset));
	}

	if (search) {
		url.searchParams.set("search", String(search));
	}

	const response = await fetch(url.toString(), { signal });

	if (!response.ok) {
		throw new Error("Failed to fetch games");
	}

	return response.json();
}

export async function getGameById(
	id: string,
	signal?: AbortSignal,
): Promise<Game> {
	const response = await fetch(`/api/games/${id}`, { signal });

	if (!response.ok) {
		throw new Error("Failed to fetch game");
	}

	return response.json() as Promise<Game>;
}

export async function getListings({
	signal,
	limit,
	offset,
	gameId,
	userId,
	search,
	type,
	sortBy,
}: GetListingsParams): Promise<Listing[]> {
	const url = new URL("/api/listings", window.location.origin);

	if (limit) {
		url.searchParams.set("limit", String(limit));
	}

	if (offset) {
		url.searchParams.set("offset", String(offset));
	}

	if (gameId) {
		url.searchParams.set("gameId", gameId);
	}

	if (userId) {
		url.searchParams.set("userId", userId);
	}

	if (search) {
		url.searchParams.set("search", search);
	}

	if (type) {
		url.searchParams.set("type", type);
	}

	if (sortBy) {
		url.searchParams.set("sortBy", sortBy);
	}

	const response = await fetch(url.toString(), {
		signal,
		headers: await getAuthHeaders(),
	});

	if (!response.ok) throw new Error("Failed to fetch listings");
	return response.json() as Promise<Listing[]>;
}

export async function getListingsByGameId(
	id: string,
	signal?: AbortSignal,
): Promise<Listing[]> {
	const response = await fetch(
		`/api/listings?gameId=${encodeURIComponent(id)}`,
		{
			signal,
			headers: await getAuthHeaders(),
		},
	);

	if (!response.ok) {
		throw new Error("Failed to fetch listings");
	}

	return response.json() as Promise<Listing[]>;
}

export async function getListingsByUserId({
	signal,
	limit,
	offset,
	userId,
}: {
	signal?: AbortSignal;
	limit?: number;
	offset?: number;
	userId: string;
}): Promise<Listing[]> {
	const url = new URL("/api/listings", window.location.origin);
	url.searchParams.set("userId", userId);

	if (limit) {
		url.searchParams.set("limit", String(limit));
	}

	if (offset) {
		url.searchParams.set("offset", String(offset));
	}

	const response = await fetch(url.toString(), {
		signal,
		headers: await getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch listings");
	}

	return response.json() as Promise<Listing[]>;
}

export async function getLikedListingsByUserId({
	userId,
	signal,
	limit,
	offset,
}: {
	userId: string;
	signal?: AbortSignal;
	limit?: number;
	offset?: number;
}): Promise<Listing[]> {
	const url = new URL(
		`/api/users/${encodeURIComponent(userId)}/liked-listings`,
		window.location.origin,
	);

	if (limit) {
		url.searchParams.set("limit", String(limit));
	}

	if (offset) {
		url.searchParams.set("offset", String(offset));
	}

	const response = await fetch(url.toString(), {
		signal,
		headers: await getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch liked listings");
	}

	return response.json() as Promise<Listing[]>;
}

export async function getListingById(
	id: string,
	signal?: AbortSignal,
): Promise<Listing> {
	const response = await fetch(`/api/listings/${id}`, {
		signal,
		headers: await getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch listing");
	}

	return response.json() as Promise<Listing>;
}

export async function getProfile(
	profileFullName: string,
	signal?: AbortSignal,
): Promise<Profile> {
	const response = await fetch(`/api/profile/${profileFullName}`, {
		signal,
		headers: await getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch profile");
	}

	return response.json() as Promise<Profile>;
}

export async function incrementListingViews(
	id: string,
	signal?: AbortSignal,
): Promise<number> {
	const response = await fetch(`/api/listings/${id}/views`, {
		method: "POST",
		signal,
	});

	if (!response.ok) {
		throw new Error("Failed to increment listing views");
	}

	const payload = (await response.json()) as { views: number };
	return payload.views;
}

export async function toggleListingLike(
	id: string,
	signal?: AbortSignal,
): Promise<void> {
	const response = await fetch(`/api/listings/${id}/likes`, {
		method: "POST",
		headers: await getAuthHeaders(),
		signal,
	});

	if (!response.ok) {
		throw new Error("Failed to toggle listing like");
	}
}

export async function createListing(
	input: CreateListingInput,
	signal?: AbortSignal,
): Promise<Listing> {
	const response = await fetch("/api/listings", {
		method: "POST",
		headers: await getAuthHeaders(),
		body: JSON.stringify(input),
		signal,
	});

	if (!response.ok) {
		throw new Error("Failed to create listing");
	}

	return response.json() as Promise<Listing>;
}
