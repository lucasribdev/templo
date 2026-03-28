import type {
	CreateListingInput,
	Game,
	GetGamesParams,
	GetListingsParams,
	Listing,
	Profile,
} from "@/types";
import { supabase } from "@/utils/supabase";
import { getOrCreateVisitorId } from "@/utils/visitor-id";

type QueryValue = string | number | null | undefined;

type ApiRequestOptions = {
	body?: BodyInit;
	headers?: HeadersInit;
	method?: string;
	query?: Record<string, QueryValue>;
	requireAuth?: boolean;
	signal?: AbortSignal;
};

async function getAuthHeaders() {
	const { data } = await supabase.auth.getSession();
	const accessToken = data.session?.access_token;

	return accessToken
		? {
				Authorization: `Bearer ${accessToken}`,
			}
		: undefined;
}

function createApiUrl(path: string, query?: Record<string, QueryValue>) {
	const url = new URL(path, window.location.origin);

	if (!query) {
		return url.toString();
	}

	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null || value === "") {
			continue;
		}

		url.searchParams.set(key, String(value));
	}

	return url.toString();
}

async function apiRequest<T>(
	path: string,
	{
		body,
		headers,
		method,
		query,
		requireAuth = false,
		signal,
	}: ApiRequestOptions = {},
): Promise<T> {
	const authHeaders = requireAuth ? await getAuthHeaders() : undefined;
	const response = await fetch(createApiUrl(path, query), {
		method,
		body,
		signal,
		headers: {
			...authHeaders,
			...headers,
		},
	});

	if (!response.ok) {
		throw new Error(`Request failed: ${method ?? "GET"} ${path}`);
	}

	return response.json() as Promise<T>;
}

function getListingsQuery({
	gameId,
	limit,
	offset,
	search,
	sortBy,
	type,
	userId,
}: {
	gameId?: string;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: string;
	type?: string;
	userId?: string;
}) {
	return {
		gameId,
		limit,
		offset,
		search,
		sortBy,
		type,
		userId,
	};
}

export async function getGames({
	signal,
	limit,
	offset,
	search,
}: GetGamesParams): Promise<Game[]> {
	return apiRequest<Game[]>("/api/games", {
		signal,
		query: {
			limit,
			offset,
			search,
		},
	});
}

export async function getGameBySlug(
	slug: string,
	signal?: AbortSignal,
): Promise<Game> {
	return apiRequest<Game>(`/api/games/${slug}`, { signal });
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
	return apiRequest<Listing[]>("/api/listings", {
		signal,
		requireAuth: true,
		query: getListingsQuery({
			limit,
			offset,
			gameId,
			userId,
			search,
			type,
			sortBy,
		}),
	});
}

export async function getListingsByGameId(
	id: string,
	signal?: AbortSignal,
): Promise<Listing[]> {
	return apiRequest<Listing[]>("/api/listings", {
		signal,
		requireAuth: true,
		query: getListingsQuery({ gameId: id }),
	});
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
	return apiRequest<Listing[]>("/api/listings", {
		signal,
		requireAuth: true,
		query: getListingsQuery({
			userId,
			limit,
			offset,
		}),
	});
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
	return apiRequest<Listing[]>(
		`/api/users/${encodeURIComponent(userId)}/liked-listings`,
		{
			signal,
			requireAuth: true,
			query: {
				limit,
				offset,
			},
		},
	);
}

export async function getListingBySlug(
	slug: string,
	signal?: AbortSignal,
): Promise<Listing> {
	return apiRequest<Listing>(`/api/listings/${slug}`, {
		signal,
		requireAuth: true,
	});
}

export async function getProfile(
	profileFullName: string,
	signal?: AbortSignal,
): Promise<Profile> {
	return apiRequest<Profile>(`/api/profile/${profileFullName}`, {
		signal,
		requireAuth: true,
	});
}

export async function incrementListingViews(
	slug: string,
	signal?: AbortSignal,
): Promise<number> {
	const payload = await apiRequest<{ views: number }>(
		`/api/listings/${slug}/views`,
		{
			method: "POST",
			requireAuth: true,
			signal,
			headers: {
				"x-visitor-id": getOrCreateVisitorId(),
			},
		},
	);

	return payload.views;
}

export async function toggleListingLike(
	slug: string,
	signal?: AbortSignal,
): Promise<void> {
	await apiRequest(`/api/listings/${slug}/likes`, {
		method: "POST",
		requireAuth: true,
		signal,
	});
}

export async function createListing(
	input: CreateListingInput,
	signal?: AbortSignal,
): Promise<Listing> {
	return apiRequest<Listing>("/api/listings", {
		method: "POST",
		requireAuth: true,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
		signal,
	});
}
