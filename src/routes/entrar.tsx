import { SiDiscord, SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import {
	createFileRoute,
	type SearchSchemaInput,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type OAuthProvider, useAuth } from "@/hooks/use-auth";
import { buildPageHead } from "@/lib/metadata";

type LoginSearch = {
	redirectTo?: string;
};

const authProviders: Array<{
	provider: OAuthProvider;
	label: string;
	Icon: typeof SiDiscord;
}> = [
	{ provider: "google", label: "Continuar com Google", Icon: SiGoogle },
	{ provider: "github", label: "Continuar com GitHub", Icon: SiGithub },
	{ provider: "discord", label: "Continuar com Discord", Icon: SiDiscord },
];

const AUTH_REDIRECT_STORAGE_KEY = "templo.auth.redirectTo";

function normalizeRedirectTo(value?: string) {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return "/";
	}

	return value;
}

function getLoginCallbackRedirectUrl(redirectTo: string) {
	const callbackPath = `/entrar?redirectTo=${encodeURIComponent(redirectTo)}`;
	if (typeof window === "undefined") return callbackPath;
	return new URL(callbackPath, window.location.origin).toString();
}

function getPostLoginRedirectPath(redirectTo?: string) {
	if (typeof window === "undefined") return redirectTo || "/";

	const storedRedirectTo = window.sessionStorage.getItem(
		AUTH_REDIRECT_STORAGE_KEY,
	);
	window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);

	return normalizeRedirectTo(storedRedirectTo ?? redirectTo);
}

export const Route = createFileRoute("/entrar")({
	validateSearch: (search: LoginSearch & SearchSchemaInput) => ({
		redirectTo: normalizeRedirectTo(
			typeof search.redirectTo === "string" ? search.redirectTo : undefined,
		),
	}),
	head: () =>
		buildPageHead({
			path: "/entrar",
			title: "Entrar | Templo",
			description: "Entre no Templo com sua conta Google, GitHub ou Discord.",
		}),
	component: LoginPage,
});

function LoginPage() {
	const { redirectTo } = Route.useSearch();
	const { isSessionLoading, session, signInWithOAuthProvider } = useAuth();
	const [isCompletingSignIn, setIsCompletingSignIn] = useState(false);
	const [signingInProvider, setSigningInProvider] =
		useState<OAuthProvider | null>(null);

	useEffect(() => {
		if (typeof window === "undefined" || session) return;

		const code = new URL(window.location.href).searchParams.get("code");
		if (!code) return;

		let isMounted = true;

		const completeSignIn = async () => {
			setIsCompletingSignIn(true);
			const { supabase } = await import("@/utils/supabase");
			const { error } = await supabase.auth.exchangeCodeForSession(code);

			if (!isMounted) return;

			if (error) {
				window.location.replace("/entrar?error=oauth_failed");
				return;
			}

			window.location.replace(getPostLoginRedirectPath(redirectTo));
		};

		void completeSignIn();

		return () => {
			isMounted = false;
		};
	}, [redirectTo, session]);

	useEffect(() => {
		if (isSessionLoading || !session) return;
		window.location.replace(getPostLoginRedirectPath(redirectTo));
	}, [isSessionLoading, redirectTo, session]);

	const handleLogin = async (provider: OAuthProvider) => {
		if (signingInProvider || isCompletingSignIn) return;
		setSigningInProvider(provider);
		window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, redirectTo || "/");

		const { error } = await signInWithOAuthProvider(
			provider,
			getLoginCallbackRedirectUrl(redirectTo || "/"),
		);

		if (error) {
			window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
			window.location.href = "/entrar?error=oauth_failed";
			setSigningInProvider(null);
		}
	};

	return (
		<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12">
			<section className="w-full max-w-md space-y-7">
				<div className="space-y-3 text-center">
					<h1 className="text-4xl font-bold tracking-tight">Entrar</h1>
					<p className="text-sm leading-6 text-gray-400">
						Use sua conta Google, GitHub ou Discord para criar comunidades,
						curtir páginas e gerenciar seu perfil.
					</p>
				</div>

				<div className="glass-panel p-5">
					<div className="space-y-3">
						{authProviders.map(({ provider, label, Icon }) => (
							<button
								key={provider}
								type="button"
								onClick={() => handleLogin(provider)}
								disabled={
									isSessionLoading ||
									isCompletingSignIn ||
									Boolean(signingInProvider)
								}
								className="btn-auth-provider inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
							>
								<Icon className="size-4" />
								{signingInProvider === provider || isCompletingSignIn
									? "Entrando..."
									: label}
							</button>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
