import type {
	Category,
	Community,
	CreateCommunityInput,
	GetCategoriesParams,
	GetCommunitiesParams,
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
	categoryId,
	limit,
	offset,
	search,
	sortBy,
	userId,
}: {
	categoryId?: string;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: string;
	userId?: string;
}) {
	return {
		categoryId,
		limit,
		offset,
		search,
		sortBy,
		userId,
	};
}

export async function getCategories({
	signal,
	limit,
	offset,
	search,
	sortBy,
}: GetCategoriesParams): Promise<Category[]> {
	return apiRequest<Category[]>("/api/categories", {
		signal,
		query: {
			limit,
			offset,
			search,
			sortBy,
		},
	});
}

export async function getCategoryBySlug(
	slug: string,
	signal?: AbortSignal,
): Promise<Category> {
	return apiRequest<Category>(`/api/categories/${slug}`, { signal });
}

export async function getCommunities({
	signal,
	limit,
	offset,
	categoryId,
	userId,
	search,
	sortBy,
}: GetCommunitiesParams): Promise<Community[]> {
	return apiRequest<Community[]>("/api/communities", {
		signal,
		requireAuth: true,
		query: getCommunitiesQuery({
			limit,
			offset,
			categoryId,
			userId,
			search,
			sortBy,
		}),
	});
}

export async function getCommunitiesByCategoryId(
	id: string,
	signal?: AbortSignal,
): Promise<Community[]> {
	return apiRequest<Community[]>("/api/communities", {
		signal,
		requireAuth: true,
		query: getCommunitiesQuery({ categoryId: id }),
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
	return apiRequest<Community[]>("/api/communities", {
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
		`/api/users/${encodeURIComponent(userId)}/liked-communities`,
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
	return apiRequest<Community>(`/api/communities/${slug}`, {
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
		`/api/communities/${slug}/views`,
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
	await apiRequest(`/api/communities/${slug}/likes`, {
		method: "POST",
		requireAuth: true,
		signal,
	});
}

export async function trackCommunityLinkClick(
	linkId: string,
	signal?: AbortSignal,
): Promise<number> {
	const payload = await apiRequest<{ clicksCount: number }>(
		`/api/community-links/${encodeURIComponent(linkId)}/clicks`,
		{
			method: "POST",
			requireAuth: true,
			signal,
			headers: {
				"x-visitor-id": getOrCreateVisitorId(),
			},
		},
	);

	return payload.clicksCount;
}

export async function createCommunity(
	input: CreateCommunityInput,
	signal?: AbortSignal,
): Promise<Community> {
	return apiRequest<Community>("/api/communities", {
		method: "POST",
		requireAuth: true,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
		signal,
	});
}
