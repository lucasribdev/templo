import { useEffect, useState } from "react";

const COOKIE_CONSENT_STORAGE_KEY = "templo:cookie-consent";
const LEGACY_COOKIE_NOTICE_STORAGE_KEY = "templo:cookie-notice-dismissed";

export type CookieConsentStatus = "accepted" | "rejected";

export function getCookieConsentStatus(): CookieConsentStatus | null {
	if (typeof window === "undefined") return null;

	const storedConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

	if (storedConsent === "accepted" || storedConsent === "rejected") {
		return storedConsent;
	}

	return null;
}

export function hasAcceptedAnalyticsCookies() {
	return getCookieConsentStatus() === "accepted";
}

function clearLegacyCookieNotice() {
	window.localStorage.removeItem(LEGACY_COOKIE_NOTICE_STORAGE_KEY);
}

interface CookieConsentBannerProps {
	onConsentChange?: (status: CookieConsentStatus) => void;
}

export function CookieConsentBanner({
	onConsentChange,
}: CookieConsentBannerProps) {
	const [isReady, setIsReady] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(getCookieConsentStatus() === null);
		setIsReady(true);
	}, []);

	if (!isReady || !isVisible) return null;

	const setConsent = (status: CookieConsentStatus) => {
		window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, status);
		clearLegacyCookieNotice();
		onConsentChange?.(status);
		setIsVisible(false);
	};

	return (
		<div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border-dark bg-bg-dark/95 px-4 py-4 shadow-2xl shadow-black/40 backdrop-blur-md">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="max-w-3xl space-y-1">
					<p className="text-sm font-bold text-white">
						Preferencias de cookies
					</p>
					<p className="text-sm leading-6 text-gray-400">
						Usamos cookies e armazenamento local essenciais para manter a
						plataforma funcionando. Cookies de analise, como Google Analytics,
						so serao ativados se voce aceitar.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<a
						href="/privacidade"
						className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-gray-400 transition-colors hover:text-brand-primary"
					>
						Privacidade
					</a>
					<button
						type="button"
						onClick={() => setConsent("rejected")}
						className="btn-secondary inline-flex items-center justify-center text-sm"
					>
						Recusar analise
					</button>
					<button
						type="button"
						onClick={() => setConsent("accepted")}
						className="btn-primary inline-flex items-center justify-center text-sm"
					>
						Aceitar analise
					</button>
				</div>
			</div>
		</div>
	);
}
