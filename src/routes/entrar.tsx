import {
	createFileRoute,
	type SearchSchemaInput,
	useNavigate,
} from "@tanstack/react-router";
import { Github, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { type OAuthProvider, useAuth } from "@/hooks/use-auth";
import { buildPageHead } from "@/lib/metadata";

type LoginSearch = {
	redirectTo?: string;
};

const authProviders: Array<{
	provider: OAuthProvider;
	label: string;
	Icon: typeof Mail;
}> = [
	{ provider: "google", label: "Continuar com Google/Gmail", Icon: Mail },
	{ provider: "github", label: "Continuar com GitHub", Icon: Github },
];

function normalizeRedirectTo(value?: string) {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return "/";
	}

	return value;
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
			description: "Entre no Templo com sua conta Google ou GitHub.",
		}),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirectTo } = Route.useSearch();
	const { isSessionLoading, session, signInWithOAuthProvider } = useAuth();
	const [signingInProvider, setSigningInProvider] =
		useState<OAuthProvider | null>(null);

	useEffect(() => {
		if (isSessionLoading || !session) return;
		navigate({ to: redirectTo || "/" });
	}, [isSessionLoading, navigate, redirectTo, session]);

	const handleLogin = async (provider: OAuthProvider) => {
		if (signingInProvider) return;
		setSigningInProvider(provider);

		const { error } = await signInWithOAuthProvider(
			provider,
			redirectTo || "/",
		);

		if (error) {
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
						Use sua conta Google ou GitHub para criar comunidades, curtir
						páginas e gerenciar seu perfil.
					</p>
				</div>

				<div className="glass-panel p-5">
					<div className="space-y-3">
						{authProviders.map(({ provider, label, Icon }) => (
							<button
								key={provider}
								type="button"
								onClick={() => handleLogin(provider)}
								disabled={isSessionLoading || Boolean(signingInProvider)}
								className="btn-auth-provider inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
							>
								<Icon className="size-4" />
								{signingInProvider === provider ? "Entrando..." : label}
							</button>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
