import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Heart, LogOut, PlusCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CommunityCard from "@/components/CommunityCard";
import UserAvatar from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useDiscordInviteStats } from "@/hooks/use-discord-invite-stats";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import {
	getCommunitiesByUserId,
	getLikedCommunitiesByUserId,
	getProfile,
} from "@/lib/api";
import { buildPageHead, truncateDescription } from "@/lib/metadata";
import { getProfilePageData } from "@/lib/page-data";
import { extractDiscordInviteCode } from "@/utils/discord";
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
						`${loaderData.initialProfile.fullName} está no Templo. Veja comunidades publicadas, curtidas e jogos em comum.`,
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
const profileCommunitySkeletonIds = [
	"profile-community-1",
	"profile-community-2",
	"profile-community-3",
];

function CommunityCardSkeleton() {
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
							{profileCommunitySkeletonIds.map((communityId) => (
								<CommunityCardSkeleton key={communityId} />
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}

function Profile() {
	const [fullNameCopied, setFullNameCopied] = useState(false);
	const [isSigningOut, setIsSigningOut] = useState(false);
	const fullNameCopiedTimeoutRef = useRef<number | null>(null);
	const { profileFullName, initialProfile } = Route.useLoaderData();
	const navigate = useNavigate();
	const { session, signOut } = useAuth();

	const { data: profile, isLoading: isProfileLoading } = useQuery({
		queryKey: ["profile", profileFullName],
		queryFn: ({ signal }) => getProfile(profileFullName, signal),
		initialData: initialProfile,
	});

	const {
		data: communitiesData,
		isLoading: isCommunitiesLoading,
		fetchNextPage: fetchNextCommunitiesPage,
		hasNextPage: hasNextCommunitiesPage,
		isFetchingNextPage: isFetchingNextCommunitiesPage,
	} = useInfiniteQuery({
		queryKey: ["communities", profile?.id],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) => {
			if (!profile) {
				throw new Error("Missing profile");
			}

			return getCommunitiesByUserId({
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
		data: likedCommunitiesData,
		isLoading: isLikedCommunitiesLoading,
		fetchNextPage: fetchNextLikedCommunitiesPage,
		hasNextPage: hasNextLikedCommunitiesPage,
		isFetchingNextPage: isFetchingNextLikedCommunitiesPage,
	} = useInfiniteQuery({
		queryKey: ["favorite-communities", profile?.id],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) => {
			if (!profile) {
				throw new Error("Missing profile");
			}

			return getLikedCommunitiesByUserId({
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

	const communities = communitiesData?.pages.flat() ?? [];
	const likedCommunities = likedCommunitiesData?.pages.flat() ?? [];
	const { data: discordStatsByCode } = useDiscordInviteStats([
		...communities,
		...likedCommunities,
	]);
	const isOwnProfile = Boolean(
		session?.user?.id && profile?.id === session.user.id,
	);

	useEffect(() => {
		return () => {
			if (fullNameCopiedTimeoutRef.current) {
				window.clearTimeout(fullNameCopiedTimeoutRef.current);
			}
		};
	}, []);

	const setCommunitiesLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>({
		hasNextPage: hasNextCommunitiesPage,
		isFetchingNextPage: isFetchingNextCommunitiesPage,
		onLoadMore: fetchNextCommunitiesPage,
	});
	const setLikedCommunitiesLoadMoreNode =
		useInfiniteScrollTrigger<HTMLDivElement>({
			hasNextPage: hasNextLikedCommunitiesPage,
			isFetchingNextPage: isFetchingNextLikedCommunitiesPage,
			onLoadMore: fetchNextLikedCommunitiesPage,
		});

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

	const handleCopyFullName = async () => {
		if (fullNameCopiedTimeoutRef.current) {
			window.clearTimeout(fullNameCopiedTimeoutRef.current);
		}

		try {
			await navigator.clipboard.writeText(profile.fullName);
			setFullNameCopied(true);
			fullNameCopiedTimeoutRef.current = window.setTimeout(() => {
				setFullNameCopied(false);
				fullNameCopiedTimeoutRef.current = null;
			}, 2000);
		} catch {
			setFullNameCopied(false);
		}
	};

	const handleSignOut = async () => {
		if (isSigningOut) return;

		setIsSigningOut(true);
		const { error } = await signOut();

		if (!error) {
			navigate({ to: "/" });
			return;
		}

		setIsSigningOut(false);
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
			<div className="flex flex-col md:flex-row items-center gap-8 glass-panel p-8">
				<UserAvatar
					avatarUrl={profile.avatarUrl}
					className="w-32 h-32 shrink-0 rounded-3xl object-cover border-4 border-brand-primary/20 text-3xl"
					name={profile.fullName}
				/>
				<div className="text-center md:text-left space-y-2">
					<div className="flex items-center justify-center gap-2 md:justify-start">
						<h1 className="text-4xl font-bold tracking-tight">
							{profile.fullName}
						</h1>
						<button
							type="button"
							onClick={handleCopyFullName}
							className="inline-flex size-8 items-center justify-center rounded-md text-gray-400 hover:border hover:border-brand-primary/50 hover:text-brand-primary"
							aria-label={`Copiar ${profile.fullName}`}
							title={fullNameCopied ? "Copiado" : "Copiar nome"}
						>
							{fullNameCopied ? (
								<Check className="size-4 text-emerald-400" />
							) : (
								<Copy className="size-4" />
							)}
						</button>
					</div>
					{memberSince(profile) && (
						<p className="text-gray-500">Membro desde {memberSince(profile)}</p>
					)}

					<div className="flex gap-4 pt-4 justify-center md:justify-start">
						<div className="text-center">
							<p className="text-2xl font-bold text-brand-primary">
								{isCommunitiesLoading ? "—" : (communities?.length ?? 0)}
							</p>
							<p className="text-[10px] text-gray-500 uppercase font-bold">
								Comunidades
							</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-brand-primary">
								{isProfileLoading || isLikedCommunitiesLoading
									? "—"
									: profile.likesCount}
							</p>
							<p className="text-[10px] text-gray-500 uppercase font-bold">
								Curtidas
							</p>
						</div>
					</div>
					{isOwnProfile && (
						<button
							type="button"
							onClick={handleSignOut}
							disabled={isSigningOut}
							className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<LogOut className="size-4" />
							{isSigningOut ? "Saindo..." : "Sair"}
						</button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
				<section className="space-y-6">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<PlusCircle className="text-brand-primary" /> Minhas Comunidades
					</h2>
					<div className="space-y-4">
						{isCommunitiesLoading
							? profileCommunitySkeletonIds.map((id) => (
									<CommunityCardSkeleton key={id} />
								))
							: communities?.map((l) => (
									<CommunityCard
										key={l.id}
										community={l}
										discordStats={
											discordStatsByCode?.[
												extractDiscordInviteCode(l.discordInvite) ?? ""
											]
										}
									/>
								))}
						{isFetchingNextCommunitiesPage && (
							<p className="text-sm text-gray-400 text-center py-4">
								Carregando mais comunidades...
							</p>
						)}
						{!isCommunitiesLoading && communities.length === 0 && (
							<p className="text-gray-500 text-center py-10 glass-panel">
								Você ainda não criou nenhuma comunidade.
							</p>
						)}
						<div ref={setCommunitiesLoadMoreNode} />
					</div>
				</section>

				<section className="space-y-6">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Heart className="text-red-500" /> Favoritos
					</h2>
					<div className="space-y-4">
						{isLikedCommunitiesLoading
							? profileCommunitySkeletonIds.map((id) => (
									<CommunityCardSkeleton key={id} />
								))
							: likedCommunities?.map((l) => (
									<CommunityCard
										key={l.id}
										community={l}
										discordStats={
											discordStatsByCode?.[
												extractDiscordInviteCode(l.discordInvite) ?? ""
											]
										}
									/>
								))}
						{isFetchingNextLikedCommunitiesPage && (
							<p className="text-sm text-gray-400 text-center py-4">
								Carregando mais favoritos...
							</p>
						)}
						{!isLikedCommunitiesLoading && likedCommunities.length === 0 && (
							<p className="text-gray-500 text-center py-10 glass-panel">
								Você ainda não favoritou nenhuma comunidade.
							</p>
						)}
						<div ref={setLikedCommunitiesLoadMoreNode} />
					</div>
				</section>
			</div>
		</div>
	);
}
