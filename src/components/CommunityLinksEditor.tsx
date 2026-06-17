import {
	SiDiscord,
	SiGithub,
	SiInstagram,
	SiTelegram,
	SiWhatsapp,
	SiYoutube,
} from "@icons-pack/react-simple-icons";
import { Globe2, Link, Plus, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CommunityPlatform, CreateCommunityLinkInput } from "@/types";
import { normalizeDiscordInvite } from "@/utils/discord";

type CommunityLinkDraft = {
	platform: CommunityPlatform;
	url: string;
	label: string;
};

type PlatformOption = {
	value: CommunityPlatform;
	label: string;
	Icon: typeof Link;
};

const platformOptions: PlatformOption[] = [
	{ value: "DISCORD", label: "Discord", Icon: SiDiscord },
	{ value: "WHATSAPP", label: "WhatsApp", Icon: SiWhatsapp },
	{ value: "TELEGRAM", label: "Telegram", Icon: SiTelegram },
	{ value: "GITHUB", label: "GitHub", Icon: SiGithub },
	{ value: "YOUTUBE", label: "YouTube", Icon: SiYoutube },
	{ value: "INSTAGRAM", label: "Instagram", Icon: SiInstagram },
	{ value: "SITE_OFICIAL", label: "Site oficial", Icon: Globe2 },
	{ value: "OUTRA", label: "Outra", Icon: Link },
];

const platformOptionByValue = new Map(
	platformOptions.map((option) => [option.value, option]),
);

function normalizeUrl(platform: CommunityPlatform, url: string) {
	if (platform === "DISCORD") {
		return normalizeDiscordInvite(url);
	}

	const trimmedUrl = url.trim();
	if (!trimmedUrl) return null;

	const normalizedUrl = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedUrl)
		? trimmedUrl
		: `https://${trimmedUrl}`;

	try {
		return new URL(normalizedUrl).toString();
	} catch {
		return null;
	}
}

function isValidDraft({ platform, url, label }: CommunityLinkDraft) {
	if (!normalizeUrl(platform, url)) return false;
	if (platform === "OUTRA" && !label.trim()) return false;
	return true;
}

function getPlatformOption(platform: CommunityPlatform) {
	return platformOptionByValue.get(platform) ?? platformOptions[0];
}

export function CommunityLinksEditor({
	value,
	onChange,
}: {
	value: CreateCommunityLinkInput[];
	onChange: (links: CreateCommunityLinkInput[]) => void;
}) {
	const platformSelectId = useId();
	const urlInputId = useId();
	const labelInputId = useId();
	const [draft, setDraft] = useState<CommunityLinkDraft>({
		platform: "DISCORD",
		url: "",
		label: "",
	});

	const selectedPlatform = getPlatformOption(draft.platform);
	const isDraftValid = useMemo(() => isValidDraft(draft), [draft]);

	const addLink = () => {
		const normalizedUrl = normalizeUrl(draft.platform, draft.url);
		if (!normalizedUrl || !isDraftValid) return;

		onChange([
			...value,
			{
				platform: draft.platform,
				url: normalizedUrl,
				position: value.length,
				label: draft.platform === "OUTRA" ? draft.label.trim() : undefined,
			},
		]);
		setDraft({ ...draft, url: "", label: "" });
	};

	const removeLink = (index: number) => {
		onChange(
			value
				.filter((_, linkIndex) => linkIndex !== index)
				.map((link, linkIndex) => ({ ...link, position: linkIndex })),
		);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-4">
				<div className="text-xs font-bold text-gray-500 uppercase">
					Canais da comunidade
				</div>
				<span
					className={cn(
						"text-xs font-medium",
						value.length > 0 ? "text-brand-primary" : "text-red-400",
					)}
				>
					{value.length > 0 ? `${value.length} link(s)` : "Adicione 1 link"}
				</span>
			</div>

			<div className="space-y-3 rounded-lg border border-border-dark bg-bg-dark/60 p-3">
				<div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
					<div className="space-y-2">
						<label
							htmlFor={platformSelectId}
							className="text-[10px] font-bold text-gray-500 uppercase"
						>
							Plataforma
						</label>
						<div className="relative">
							<selectedPlatform.Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
							<select
								id={platformSelectId}
								value={draft.platform}
								onChange={(event) =>
									setDraft({
										platform: event.target.value as CommunityPlatform,
										url: draft.url,
										label: "",
									})
								}
								className="h-11 w-full rounded-lg border border-border-dark bg-bg-dark py-2 pl-9 pr-3 text-sm font-medium focus:border-brand-primary focus:outline-none"
							>
								{platformOptions.map(({ value: optionValue, label }) => (
									<option key={optionValue} value={optionValue}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="space-y-2">
						<label
							htmlFor={urlInputId}
							className="text-[10px] font-bold text-gray-500 uppercase"
						>
							URL
						</label>
						<input
							id={urlInputId}
							type="url"
							value={draft.url}
							onChange={(event) =>
								setDraft({ ...draft, url: event.target.value })
							}
							placeholder={
								draft.platform === "DISCORD"
									? "https://discord.gg/..."
									: "https://..."
							}
							className="h-11 w-full rounded-lg border border-border-dark bg-bg-dark p-3 text-sm focus:border-brand-primary focus:outline-none"
						/>
					</div>

					<div className="flex items-end">
						<button
							type="button"
							onClick={addLink}
							disabled={!isDraftValid}
							className={cn(
								"inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-primary/40 px-4 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/10 md:w-11 md:px-0",
								!isDraftValid &&
									"cursor-not-allowed opacity-50 hover:bg-transparent",
							)}
							aria-label="Adicionar link"
						>
							<Plus className="h-4 w-4" />
							<span className="md:hidden">Adicionar</span>
						</button>
					</div>
				</div>

				{draft.platform === "OUTRA" && (
					<div className="space-y-2">
						<label
							htmlFor={labelInputId}
							className="text-[10px] font-bold text-gray-500 uppercase"
						>
							Label
						</label>
						<input
							id={labelInputId}
							type="text"
							value={draft.label}
							onChange={(event) =>
								setDraft({ ...draft, label: event.target.value })
							}
							placeholder="Ex: Fórum, loja, grupo"
							className="h-11 w-full rounded-lg border border-border-dark bg-bg-dark p-3 text-sm focus:border-brand-primary focus:outline-none"
						/>
					</div>
				)}
			</div>

			{value.length > 0 && (
				<div className="space-y-2">
					{value.map((link, index) => {
						const platform = getPlatformOption(link.platform);
						return (
							<div
								key={`${link.platform}-${link.url}-${index}`}
								className="flex min-h-12 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
							>
								<platform.Icon className="h-4 w-4 shrink-0 text-brand-primary" />
								<div className="min-w-0 flex-1">
									<div className="text-sm font-bold">
										{link.label || platform.label}
									</div>
									<div className="truncate text-xs text-gray-500">
										{link.url}
									</div>
								</div>
								<button
									type="button"
									onClick={() => removeLink(index)}
									className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
									aria-label="Remover link"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
