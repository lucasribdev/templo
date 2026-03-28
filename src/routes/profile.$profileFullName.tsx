import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, PlusCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import ListingCard from "@/components/ListingCard";
import {
	getLikedListingsByUserId,
	getListingsByUserId,
	getProfile,
} from "@/lib/api";

export const Route = createFileRoute("/profile/$profileFullName")({
	loader: async ({ params }) => {
		return { profileFullName: params?.profileFullName };
	},
	component: Profile,
});

const pageSize = 6;

function Profile() {
	const listingsLoadMoreRef = useRef<HTMLDivElement | null>(null);
	const likedListingsLoadMoreRef = useRef<HTMLDivElement | null>(null);

	const { profileFullName } = Route.useLoaderData();

	const { data: profile, isLoading: isProfileLoading } = useQuery({
		queryKey: ["profile", profileFullName],
		queryFn: ({ signal }) => getProfile(profileFullName, signal),
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

	useEffect(() => {
		const node = listingsLoadMoreRef.current;
		if (!node || !hasNextListingsPage) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextListingsPage) {
					void fetchNextListingsPage();
				}
			},
			{ rootMargin: "300px" },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [fetchNextListingsPage, hasNextListingsPage, isFetchingNextListingsPage]);

	useEffect(() => {
		const node = likedListingsLoadMoreRef.current;
		if (!node || !hasNextLikedListingsPage) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isFetchingNextLikedListingsPage) {
					void fetchNextLikedListingsPage();
				}
			},
			{ rootMargin: "300px" },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [
		fetchNextLikedListingsPage,
		hasNextLikedListingsPage,
		isFetchingNextLikedListingsPage,
	]);

	const memberSince = profile?.createdAt
		? new Intl.DateTimeFormat("pt-BR", {
				month: "long",
				year: "numeric",
			}).format(new Date(profile.createdAt))
		: null;

	if (isProfileLoading) {
		return <div className="p-20 text-center">Carregando perfil...</div>;
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
					{memberSince && (
						<p className="text-gray-500">Membro desde {memberSince}</p>
					)}

					<div className="flex gap-4 pt-4">
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
						{listings?.map((l) => (
							<ListingCard key={l.id} listing={l} />
						))}
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
						<div ref={listingsLoadMoreRef} />
					</div>
				</section>

				<section className="space-y-6">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Heart className="text-red-500" /> Favoritos
					</h2>
					<div className="space-y-4">
						{likedListings?.map((l) => (
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
						<div ref={likedListingsLoadMoreRef} />
					</div>
				</section>
			</div>
		</div>
	);
}
