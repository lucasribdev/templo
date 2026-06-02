import type {
	Community,
	CreateCommunityInput,
	DiscordInviteStats,
	Game,
	GetCommunitiesParams,
	GetGamesParams,
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

function getCommunitiesQuery({
	gameId,
	limit,
	offset,
	search,
	sortBy,
	userId,
}: {
	gameId?: string;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: string;
	userId?: string;
}) {
	return {
		gameId,
		limit,
		offset,
		search,
		sortBy,
		userId,
	};
}

export async function getGames({
	signal,
	limit,
	offset,
	search,
	sortBy,
}: GetGamesParams): Promise<Game[]> {
	return apiRequest<Game[]>("/api/games", {
		signal,
		query: {
			limit,
			offset,
			search,
			sortBy,
		},
	});
}

export async function getGameBySlug(
	slug: string,
	signal?: AbortSignal,
): Promise<Game> {
	return apiRequest<Game>(`/api/games/${slug}`, { signal });
}

export async function getCommunities({
	signal,
	limit,
	offset,
	gameId,
	userId,
	search,
	sortBy,
}: GetCommunitiesParams): Promise<Community[]> {
	return apiRequest<Community[]>("/api/listings", {
		signal,
		requireAuth: true,
		query: getCommunitiesQuery({
			limit,
			offset,
			gameId,
			userId,
			search,
			sortBy,
		}),
	});
}

export async function getCommunitiesByGameId(
	id: string,
	signal?: AbortSignal,
): Promise<Community[]> {
	return apiRequest<Community[]>("/api/listings", {
		signal,
		requireAuth: true,
		query: getCommunitiesQuery({ gameId: id }),
	});
}

export async function getCommunitiesByUserId({
	signal,
	limit,
	offset,
	userId,
}: {
	signal?: AbortSignal;
	limit?: number;
	offset?: number;
	userId: string;
}): Promise<Community[]> {
	return apiRequest<Community[]>("/api/listings", {
		signal,
		requireAuth: true,
		query: getCommunitiesQuery({
			userId,
			limit,
			offset,
		}),
	});
}

export async function getLikedCommunitiesByUserId({
	userId,
	signal,
	limit,
	offset,
}: {
	userId: string;
	signal?: AbortSignal;
	limit?: number;
	offset?: number;
}): Promise<Community[]> {
	return apiRequest<Community[]>(
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

export async function getCommunityBySlug(
	slug: string,
	signal?: AbortSignal,
): Promise<Community> {
	return apiRequest<Community>(`/api/listings/${slug}`, {
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

export async function incrementCommunityViews(
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

export async function toggleCommunityLike(
	slug: string,
	signal?: AbortSignal,
): Promise<void> {
	await apiRequest(`/api/listings/${slug}/likes`, {
		method: "POST",
		requireAuth: true,
		signal,
	});
}

export async function getDiscordInviteStats(
	inviteCodes: string[],
	signal?: AbortSignal,
): Promise<Record<string, DiscordInviteStats>> {
	if (inviteCodes.length === 0) {
		return {};
	}

	return apiRequest<Record<string, DiscordInviteStats>>(
		"/api/discord-invite-stats",
		{
			signal,
			query: {
				codes: Array.from(new Set(inviteCodes)).join(","),
			},
		},
	);
}

export async function createCommunity(
	input: CreateCommunityInput,
	signal?: AbortSignal,
): Promise<Community> {
	return apiRequest<Community>("/api/listings", {
		method: "POST",
		requireAuth: true,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
		signal,
	});
}
