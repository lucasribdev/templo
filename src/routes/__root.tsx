import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { GoogleAnalytics } from "tanstack-router-ga4";
import { AuthPromptProvider } from "@/components/AuthPromptModal";
import BackToTop from "@/components/BackToTop";
import {
	CookieConsentBanner,
	hasAcceptedAnalyticsCookies,
} from "@/components/CookieConsentBanner";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { buildPageHead } from "@/lib/metadata";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...buildPageHead().meta,
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
		],
	}),
	notFoundComponent: NotFound,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const [canLoadAnalytics, setCanLoadAnalytics] = useState(false);

	useEffect(() => {
		setCanLoadAnalytics(hasAcceptedAnalyticsCookies());
	}, []);

	return (
		<html lang="pt-BR">
			<head>
				<HeadContent />
			</head>
			<body>
				<TanStackQueryProvider>
					<AuthProvider>
						<AuthPromptProvider>
							<div className="min-h-screen flex flex-col">
								<Header />
								<main className="flex-grow">{children}</main>
								<BackToTop />
								<Toaster />
								<CookieConsentBanner
									onConsentChange={(status) =>
										setCanLoadAnalytics(status === "accepted")
									}
								/>
								<footer className="border-t border-border-dark py-12 mt-20">
									<div className="max-w-7xl mx-auto px-4 text-center space-y-4">
										<div className="flex items-center justify-center gap-2">
											<div className="w-6 h-6 bg-brand-primary rounded flex items-center justify-center">
												<Flame className="text-black w-4 h-4" />
											</div>
											<span className="text-lg font-bold tracking-tighter">
												Templo
											</span>
										</div>
										<p className="text-gray-500 text-sm">
											&copy; 2026 Templo. Feito para jogadores, por jogadores.
										</p>
										<nav
											aria-label="Links legais"
											className="flex items-center justify-center gap-4 text-sm"
										>
											<Link
												to="/privacidade"
												className="text-gray-500 hover:text-brand-primary transition-colors"
											>
												Política de Privacidade
											</Link>
											<Link
												to="/termos-de-uso"
												className="text-gray-500 hover:text-brand-primary transition-colors"
											>
												Termos de Uso
											</Link>
										</nav>
									</div>
								</footer>
							</div>
						</AuthPromptProvider>
					</AuthProvider>
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</TanStackQueryProvider>
				{GA_MEASUREMENT_ID && canLoadAnalytics && (
					<GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
				)}
				<Scripts />
			</body>
		</html>
	);
}

function NotFound() {
	return (
		<div className="max-w-3xl mx-auto px-4 py-24">
			<div className="glass-panel p-10 text-center space-y-4">
				<p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">
					404
				</p>
				<h1 className="text-3xl font-bold tracking-tight">
					Página não encontrada
				</h1>
				<p className="text-gray-400">
					O link pode estar incorreto ou o conteúdo não existe mais.
				</p>
				<div>
					<Link to="/" className="btn-primary inline-flex">
						Voltar para a home
					</Link>
				</div>
			</div>
		</div>
	);
}
