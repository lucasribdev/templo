import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, PlusCircle } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import {
	getLikedListingsByUserId,
	getListingsByUserId,
	getProfile,
} from "@/lib/api";
import { buildPageHead, truncateDescription } from "@/lib/metadata";
import { getProfilePageData } from "@/lib/page-data";
import { memberSince } from "@/utils/profile";

export const Route = createFileRoute("/profile/$profileFullName")({
	loader: async ({ params }) => {
		const profileFullName = params?.profileFullName;
		return {
			profileFullName,
			initialProfile: await getProfilePageData({ data: profileFullName }),
		};
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return buildPageHead({
				path: "/profile",
				title: "Perfil | Templo",
				description: "Veja este perfil no Templo.",
				type: "profile",
			});
		}

		return buildPageHead({
			path: `/profile/${loaderData.profileFullName}`,
			title: loaderData.initialProfile
				? `${loaderData.initialProfile.fullName} | Templo`
				: "Perfil | Templo",
			description: loaderData.initialProfile
				? truncateDescription(
						`${loaderData.initialProfile.fullName} está no Templo. Veja anúncios publicados, curtidas e jogos em comum.`,
					)
				: "Veja este perfil no Templo.",
			image: loaderData.initialProfile?.avatarUrl || undefined,
			type: "profile",
		});
	},
	component: Profile,
});

const pageSize = 6;
const profileSectionSkeletonIds = ["profile-owned", "profile-liked"];
const profileListingSkeletonIds = [
	"profile-listing-1",
	"profile-listing-2",
	"profile-listing-3",
];

function ListingCardSkeleton() {
	return (
		<div className="glass-panel p-5 flex flex-col gap-4">
			<div className="flex justify-between items-start">
				<Skeleton className="h-5 w-28 rounded-full" />
				<Skeleton className="h-5 w-10" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-5 w-14 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
				<Skeleton className="h-5 w-12 rounded-full" />
			</div>
			<div className="pt-4 border-t border-border-dark flex justify-between items-center gap-3">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<Skeleton className="h-4 w-4 rounded-full" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-3 w-16" />
					<Skeleton className="h-3 w-10" />
				</div>
				<Skeleton className="h-4 w-20" />
			</div>
		</div>
	);
}

function ProfileSkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
			<div className="flex flex-col md:flex-row items-center gap-8 glass-panel p-8">
				<Skeleton className="h-32 w-32 rounded-3xl shrink-0" />
				<div className="w-full max-w-sm space-y-3">
					<Skeleton className="h-10 w-2/3" />
					<Skeleton className="h-5 w-1/2" />
					<div className="flex gap-4 pt-4">
						<div className="space-y-2">
							<Skeleton className="h-8 w-10" />
							<Skeleton className="h-3 w-16" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-8 w-10" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
				{profileSectionSkeletonIds.map((sectionId) => (
					<section className="space-y-6" key={sectionId}>
						<Skeleton className="h-8 w-40" />
						<div className="space-y-4">
							{profileListingSkeletonIds.map((listingId) => (
								<ListingCardSkeleton key={listingId} />
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}

function Profile() {
	const { profileFullName, initialProfile } = Route.useLoaderData();

	const { data: profile, isLoading: isProfileLoading } = useQuery({
		queryKey: ["profile", profileFullName],
		queryFn: ({ signal }) => getProfile(profileFullName, signal),
		initialData: initialProfile,
	});

	const {
		data: listingsData,
		isLoading: isListingsLoading,
		fetchNextPage: fetchNextListingsPage,
		hasNextPage: hasNextListingsPage,
		isFetchingNextPage: isFetchingNextListingsPage,
	} = useInfiniteQuery({
		queryKey: ["listings", profile?.id],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) => {
			if (!profile) {
				throw new Error("Missing profile");
			}

			return getListingsByUserId({
				userId: profile.id,
				signal,
				limit: pageSize,
				offset: pageParam,
			});
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < pageSize) return undefined;
			return allPages.flat().length;
		},
		enabled: !!profile,
	});

	const {
		data: likedListingsData,
		isLoading: isLikedListingsLoading,
		fetchNextPage: fetchNextLikedListingsPage,
		hasNextPage: hasNextLikedListingsPage,
		isFetchingNextPage: isFetchingNextLikedListingsPage,
	} = useInfiniteQuery({
		queryKey: ["favorite-listings", profile?.id],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) => {
			if (!profile) {
				throw new Error("Missing profile");
			}

			return getLikedListingsByUserId({
				userId: profile.id,
				signal,
				limit: pageSize,
				offset: pageParam,
			});
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < pageSize) return undefined;
			return allPages.flat().length;
		},
		enabled: !!profile,
	});

	const listings = listingsData?.pages.flat() ?? [];
	const likedListings = likedListingsData?.pages.flat() ?? [];
	const setListingsLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>({
		hasNextPage: hasNextListingsPage,
		isFetchingNextPage: isFetchingNextListingsPage,
		onLoadMore: fetchNextListingsPage,
	});
	const setLikedListingsLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>(
		{
			hasNextPage: hasNextLikedListingsPage,
			isFetchingNextPage: isFetchingNextLikedListingsPage,
			onLoadMore: fetchNextLikedListingsPage,
		},
	);

	if (isProfileLoading) {
		return <ProfileSkeleton />;
	}

	if (!profile) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16">
				<div className="glass-panel p-10 text-center space-y-4">
					<h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
					<p className="text-gray-400">Perfil não encontrado.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
			<div className="flex flex-col md:flex-row items-center gap-8 glass-panel p-8">
				{profile.avatarUrl ? (
					<img
						src={profile.avatarUrl}
						alt={profile.fullName}
						className="w-32 h-32 shrink-0 rounded-3xl object-cover border-4 border-brand-primary/20"
						referrerPolicy="no-referrer"
					/>
				) : (
					<div className="w-32 h-32 rounded-3xl border-4 border-brand-primary/20 bg-white/5 flex items-center justify-center text-3xl font-bold">
						{profile.fullName.slice(0, 1).toUpperCase()}
					</div>
				)}
				<div className="text-center md:text-left space-y-2">
					<h1 className="text-4xl font-bold tracking-tight">
						{profile.fullName}
					</h1>
					{memberSince(profile) && (
						<p className="text-gray-500">Membro desde {memberSince(profile)}</p>
					)}

					<div className="flex gap-4 pt-4 justify-center md:justify-start">
						<div className="text-center">
							<p className="text-2xl font-bold text-brand-primary">
								{isListingsLoading ? "—" : (listings?.length ?? 0)}
							</p>
							<p className="text-[10px] text-gray-500 uppercase font-bold">
								Anúncios
							</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-brand-primary">
								{isProfileLoading || isLikedListingsLoading
									? "—"
									: profile.likesCount}
							</p>
							<p className="text-[10px] text-gray-500 uppercase font-bold">
								Curtidas
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
				<section className="space-y-6">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<PlusCircle className="text-brand-primary" /> Meus Anúncios
					</h2>
					<div className="space-y-4">
						{isListingsLoading
							? profileListingSkeletonIds.map((id) => (
									<ListingCardSkeleton key={id} />
								))
							: listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
						{isFetchingNextListingsPage && (
							<p className="text-sm text-gray-400 text-center py-4">
								Carregando mais anúncios...
							</p>
						)}
						{!isListingsLoading && listings.length === 0 && (
							<p className="text-gray-500 text-center py-10 glass-panel">
								Você ainda não criou nenhum anúncio.
							</p>
						)}
						<div ref={setListingsLoadMoreNode} />
					</div>
				</section>

				<section className="space-y-6">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Heart className="text-red-500" /> Favoritos
					</h2>
					<div className="space-y-4">
						{isLikedListingsLoading
							? profileListingSkeletonIds.map((id) => (
									<ListingCardSkeleton key={id} />
								))
							: likedListings?.map((l) => (
									<ListingCard key={l.id} listing={l} />
								))}
						{isFetchingNextLikedListingsPage && (
							<p className="text-sm text-gray-400 text-center py-4">
								Carregando mais favoritos...
							</p>
						)}
						{!isLikedListingsLoading && likedListings.length === 0 && (
							<p className="text-gray-500 text-center py-10 glass-panel">
								Você ainda não favoritou nenhum anúncio.
							</p>
						)}
						<div ref={setLikedListingsLoadMoreNode} />
					</div>
				</section>
			</div>
		</div>
	);
}
