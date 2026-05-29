import { useEffect, useState } from "react";

const COOKIE_NOTICE_STORAGE_KEY = "templo:cookie-notice-dismissed";

function hasDismissedCookieNotice() {
	if (typeof window === "undefined") return true;

	return window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) === "true";
}

export function CookieConsentBanner() {
	const [isReady, setIsReady] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(!hasDismissedCookieNotice());
		setIsReady(true);
	}, []);

	if (!isReady || !isVisible) return null;

	const dismissNotice = () => {
		window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "true");
		setIsVisible(false);
	};

	return (
		<div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border-dark bg-bg-dark/95 px-4 py-4 shadow-2xl shadow-black/40 backdrop-blur-md">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="max-w-3xl space-y-1">
					<p className="text-sm font-bold text-white">Cookies essenciais</p>
					<p className="text-sm leading-6 text-gray-400">
						Usamos cookies e armazenamento local necessários para manter sua
						sessão, preferências e recursos básicos da plataforma.
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
						onClick={dismissNotice}
						className="btn-primary inline-flex items-center justify-center text-sm"
					>
						Entendi
					</button>
				</div>
			</div>
		</div>
	);
}
