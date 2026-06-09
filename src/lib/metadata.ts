const APP_NAME = "Templo";
const DEFAULT_TITLE = "Templo - Toda comunidade merece um endereço próprio";
const DEFAULT_DESCRIPTION =
	"Toda comunidade merece um endereço próprio na internet. Crie a página oficial da sua comunidade, reúna seus canais e seja encontrado.";
const DEFAULT_IMAGE_PATH = "/logo192.png";
const DEFAULT_IMAGE_SIZE = 192;

type BuildMetadataInput = {
	description?: string;
	image?: string;
	imageHeight?: number;
	imageWidth?: number;
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
	imageHeight,
	imageWidth,
	path = "/",
	title = DEFAULT_TITLE,
	type = "website",
}: BuildMetadataInput = {}) {
	const absoluteUrl = toAbsoluteUrl(path);
	const absoluteImage = toAbsoluteUrl(image) ?? absoluteUrl;
	const resolvedImageWidth =
		imageWidth ??
		(image === DEFAULT_IMAGE_PATH ? DEFAULT_IMAGE_SIZE : undefined);
	const resolvedImageHeight =
		imageHeight ??
		(image === DEFAULT_IMAGE_PATH ? DEFAULT_IMAGE_SIZE : undefined);

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
			...(absoluteImage && resolvedImageWidth
				? [
						{
							property: "og:image:width",
							content: String(resolvedImageWidth),
						},
					]
				: []),
			...(absoluteImage && resolvedImageHeight
				? [
						{
							property: "og:image:height",
							content: String(resolvedImageHeight),
						},
					]
				: []),
			{ name: "twitter:card", content: "summary" },
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
