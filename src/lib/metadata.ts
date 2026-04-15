const APP_NAME = "Templo";
const DEFAULT_TITLE = "Templo - Encontre outros jogadores facilmente";
const DEFAULT_DESCRIPTION =
	"Descubra servidores, clãs, guildas e comunidades para jogar. Conecte-se com jogadores que compartilham sua paixão.";
const DEFAULT_IMAGE_PATH = "/logo512.png";

type BuildMetadataInput = {
	description?: string;
	image?: string;
	path?: string;
	title?: string;
	type?: "profile" | "website";
};

function getSiteUrl() {
	const siteUrl = import.meta.env.VITE_SITE_URL?.trim();
	if (!siteUrl) {
		return undefined;
	}

	return siteUrl.replace(/\/+$/, "");
}

function toAbsoluteUrl(value?: string) {
	if (!value) {
		return undefined;
	}

	try {
		return new URL(value).toString();
	} catch {
		const siteUrl = getSiteUrl();
		if (!siteUrl) {
			return undefined;
		}

		return new URL(value, siteUrl).toString();
	}
}

export function buildPageHead({
	description = DEFAULT_DESCRIPTION,
	image = DEFAULT_IMAGE_PATH,
	path = "/",
	title = DEFAULT_TITLE,
	type = "website",
}: BuildMetadataInput = {}) {
	const absoluteUrl = toAbsoluteUrl(path);
	const absoluteImage = toAbsoluteUrl(image) ?? absoluteUrl;

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{ property: "og:site_name", content: APP_NAME },
			{ property: "og:locale", content: "pt_BR" },
			{ property: "og:type", content: type },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			...(absoluteUrl ? [{ property: "og:url", content: absoluteUrl }] : []),
			...(absoluteImage
				? [{ property: "og:image", content: absoluteImage }]
				: []),
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			...(absoluteImage
				? [{ name: "twitter:image", content: absoluteImage }]
				: []),
		],
	};
}

export function truncateDescription(value?: string, maxLength = 180) {
	if (!value) {
		return DEFAULT_DESCRIPTION;
	}

	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}

	return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
