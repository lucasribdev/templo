export type CommunitySortBy = "DATE" | "POPULARITY" | "RELEVANCE";
export type CategorySortBy = "CREATED_AT" | "ALPHABETICAL";

export interface Category {
	id: string;
	slug: string;
	name: string;
	coverUrl: string;
	genres: string[];
	releaseDate: string;
	website: string;
	createdAt: string;
}

export interface CategoryRow {
	id: string;
	slug: string;
	name: string;
	cover_url: string;
	genres: string[];
	release_date: string;
	website: string;
	created_at: string;
}

export interface Community {
	id: string;
	slug: string;
	userId: string;
	category: Category;
	profile: ProfileSummary;
	title: string;
	description?: string;
	tags?: string[];
	discordInvite?: string;
	views: number;
	active: boolean;
	likesCount: number;
	userLiked: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CommunityByIdRpcRow {
	id: string;
	slug: string;
	user_id: string;
	category_id: string;
	category_slug: string;
	category_name: string;
	category_cover_url?: string;
	category_genres?: string[];
	category_release_date?: string;
	category_website?: string;
	title: string;
	description?: string;
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
	profile_created_at: string;
}

export interface CommunitiesRpcRow {
	id: string;
	slug: string;
	user_id: string;
	category_id: string;
	category_slug: string;
	category_name: string;
	title: string;
	description?: string;
	tags?: string[];
	discord_invite?: string;
	views: number;
	active: boolean;
	likes_count: number;
	user_liked: boolean;
	created_at: string;
	updated_at: string;
	category_cover_url?: string;
	category_genres?: string[];
	category_release_date?: string;
	category_website?: string;
	profile_username: string;
	profile_full_name: string;
	profile_avatar_url: string;
	profile_created_at: string;
}

export interface ProfileSummary {
	id: string;
	username: string;
	fullName: string;
	avatarUrl: string;
	createdAt: string;
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

export interface CreateCommunityInput {
	categoryId?: string;
	suggestedCategoryName?: string;
	title: string;
	description: string;
	discordInvite: string;
	tags: string[];
}

export interface CommunityLikes {
	id: string;
	communityId: string;
	userId: string;
	createdAt: string;
}

export interface CommunityLikesRow {
	id: string;
	community_id: string;
	user_id: string;
	created_at: string;
}

export interface CommunityLikeCount {
	count: number;
}

export interface CommunityLikeUser {
	user_id: string;
}

export interface GetCategoriesParams {
	signal?: AbortSignal;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: CategorySortBy;
}

export interface GetCommunitiesParams {
	signal?: AbortSignal;
	limit: number;
	offset: number;
	categoryId?: string;
	userId?: string;
	search?: string;
	sortBy?: CommunitySortBy;
}
