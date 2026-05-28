import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const GA_CONSENT_STORAGE_KEY = "templo:analytics-consent";
const GA_SCRIPT_ID = "google-analytics-script";

type AnalyticsConsent = "accepted" | "rejected";

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

function getAnalyticsConsent(): AnalyticsConsent | null {
	if (typeof window === "undefined") return null;

	const storedConsent = window.localStorage.getItem(GA_CONSENT_STORAGE_KEY);
	return storedConsent === "accepted" || storedConsent === "rejected"
		? storedConsent
		: null;
}

function setAnalyticsConsent(consent: AnalyticsConsent) {
	window.localStorage.setItem(GA_CONSENT_STORAGE_KEY, consent);
	window.dispatchEvent(new CustomEvent("templo:analytics-consent-change"));
}

function getMeasurementId() {
	return import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
}

function initGoogleAnalytics(measurementId: string) {
	if (!measurementId) return;

	window.dataLayer = window.dataLayer ?? [];
	window.gtag =
		window.gtag ??
		function gtag(...args: unknown[]) {
			window.dataLayer?.push(args);
		};

	if (document.getElementById(GA_SCRIPT_ID)) return;

	window.gtag("consent", "default", {
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
		analytics_storage: "denied",
	});
	window.gtag("js", new Date());
	window.gtag("config", measurementId, {
		send_page_view: false,
	});

	const script = document.createElement("script");
	script.id = GA_SCRIPT_ID;
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
		measurementId,
	)}`;
	document.head.appendChild(script);
}

function updateGoogleAnalyticsConsent(consent: AnalyticsConsent | null) {
	window.gtag?.("consent", "update", {
		analytics_storage: consent === "accepted" ? "granted" : "denied",
	});
}

function trackPageView(measurementId: string, pagePath: string) {
	window.gtag?.("event", "page_view", {
		send_to: measurementId,
		page_path: pagePath,
		page_location: window.location.href,
		page_title: document.title,
	});
}

export function Analytics() {
	const measurementId = getMeasurementId();
	const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
	const location = useRouterState({ select: (state) => state.location });
	const pagePath = `${location.pathname}${location.searchStr}`;

	useEffect(() => {
		if (!measurementId) return;

		initGoogleAnalytics(measurementId);

		const syncConsent = () => setConsent(getAnalyticsConsent());

		syncConsent();
		window.addEventListener("templo:analytics-consent-change", syncConsent);

		return () => {
			window.removeEventListener(
				"templo:analytics-consent-change",
				syncConsent,
			);
		};
	}, [measurementId]);

	useEffect(() => {
		if (!measurementId) return;

		updateGoogleAnalyticsConsent(consent);
		if (consent !== "accepted") return;

		trackPageView(measurementId, pagePath);
	}, [measurementId, pagePath, consent]);

	return null;
}

export function CookieConsentBanner() {
	const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
	const [isReady, setIsReady] = useState(false);
	const measurementId = getMeasurementId();

	useEffect(() => {
		setConsent(getAnalyticsConsent());
		setIsReady(true);
	}, []);

	if (!measurementId || !isReady || consent) return null;

	const acceptAnalytics = () => {
		setAnalyticsConsent("accepted");
		setConsent("accepted");
	};

	const rejectAnalytics = () => {
		setAnalyticsConsent("rejected");
		setConsent("rejected");
	};

	return (
		<div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border-dark bg-bg-dark/95 px-4 py-4 shadow-2xl shadow-black/40 backdrop-blur-md">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="max-w-3xl space-y-1">
					<p className="text-sm font-bold text-white">Cookies e analytics</p>
					<p className="text-sm leading-6 text-gray-400">
						Usamos cookies essenciais e, com seu consentimento, Google Analytics
						para entender o uso do Templo e melhorar a experiência.
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
						onClick={rejectAnalytics}
						className="inline-flex items-center justify-center rounded-lg border border-border-dark px-4 py-2 text-sm font-bold text-gray-300 transition-colors hover:border-white/20 hover:bg-white/5"
					>
						Recusar
					</button>
					<button
						type="button"
						onClick={acceptAnalytics}
						className="btn-primary inline-flex items-center justify-center text-sm"
					>
						Aceitar
					</button>
				</div>
			</div>
		</div>
	);
}
