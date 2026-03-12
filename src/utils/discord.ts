const DISCORD_HOSTS = new Set([
	"discord.gg",
	"www.discord.gg",
	"discord.com",
	"www.discord.com",
	"ptb.discord.com",
	"canary.discord.com",
	"discordapp.com",
	"www.discordapp.com",
]);

function toUrl(value: string) {
	const trimmedValue = value.trim();
	if (!trimmedValue) return null;

	const normalizedValue = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedValue)
		? trimmedValue
		: `https://${trimmedValue}`;

	try {
		return new URL(normalizedValue);
	} catch {
		return null;
	}
}

export function isValidDiscordInvite(value: string) {
	const url = toUrl(value);
	if (!url) return false;

	return DISCORD_HOSTS.has(url.hostname.toLowerCase());
}

export function normalizeDiscordInvite(value: string) {
	const url = toUrl(value);
	if (!url || !DISCORD_HOSTS.has(url.hostname.toLowerCase())) {
		return null;
	}

	return url.toString();
}
