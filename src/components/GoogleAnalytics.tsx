import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

declare global {
	interface Window {
		dataLayer: unknown[];
		gtag: (...args: any[]) => void;
	}
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
	const location = useRouterState({
		select: (state) => state.location,
	});

	useEffect(() => {
		if (!measurementId) return;

		const script = document.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
		document.head.appendChild(script);

		window.dataLayer = window.dataLayer || [];

		function gtag(...args: any[]) {
			window.dataLayer.push(args);
		}

		window.gtag = gtag;

		gtag("js", new Date());
		gtag("config", measurementId);

		return () => {
			document.head.removeChild(script);
		};
	}, []);

	useEffect(() => {
		if (!window.gtag || !measurementId) return;

		window.gtag("config", measurementId, {
			page_path: location.pathname,
		});
	}, [location.pathname]);

	return null;
}
