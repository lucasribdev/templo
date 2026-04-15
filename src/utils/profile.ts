import type { Profile, ProfileSummary } from "@/types";

export const memberSince = (profile: Profile | ProfileSummary) =>
	profile?.createdAt
		? new Intl.DateTimeFormat("pt-BR", {
				month: "long",
				year: "numeric",
			}).format(new Date(profile.createdAt))
		: null;
