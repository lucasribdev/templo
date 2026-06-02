import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getDiscordInviteStats } from "@/lib/api";
import type { Community, DiscordInviteStats } from "@/types";
import { extractDiscordInviteCode } from "@/utils/discord";

export function getDiscordInviteCodesFromCommunities(listings: Community[]) {
	return Array.from(
		new Set(
			listings
				.map((listing) => extractDiscordInviteCode(listing.discordInvite))
				.filter((code): code is string => Boolean(code)),
		),
	).sort();
}

export function useDiscordInviteStats(listings: Community[]) {
	const [statsByCode, setStatsByCode] = useState<
		Record<string, DiscordInviteStats>
	>({});
	const inviteCodes = useMemo(
		() => getDiscordInviteCodesFromCommunities(listings),
		[listings],
	);
	const missingInviteCodes = useMemo(
		() => inviteCodes.filter((code) => !statsByCode[code]),
		[inviteCodes, statsByCode],
	);

	const query = useQuery({
		queryKey: ["discord-invite-stats", missingInviteCodes],
		queryFn: ({ signal }) => getDiscordInviteStats(missingInviteCodes, signal),
		enabled: missingInviteCodes.length > 0,
		staleTime: 5 * 60 * 1000,
	});

	useEffect(() => {
		if (!query.data) return;

		setStatsByCode((current) => ({
			...current,
			...query.data,
		}));
	}, [query.data]);

	return {
		...query,
		data: statsByCode,
	};
}
