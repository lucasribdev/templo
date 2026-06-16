import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, LogIn, PlusCircle, UserIcon } from "lucide-react";
import { useState } from "react";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const { isSessionLoading, session, signInWithOAuthProvider } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();

	const navigate = useNavigate();
	const profileFullName = session?.user.user_metadata.full_name;

	const handleLogin = async () => {
		if (isAuthLoading) return;

		setIsAuthLoading(true);
		const { error } = await signInWithOAuthProvider("discord", "/");

		if (error) {
			window.location.href = "?error=oauth_failed";
			setIsAuthLoading(false);
		}
	};

	const handleCreateCommunity = () => {
		if (session) {
			navigate({ to: "/criar-comunidade" });
			return;
		}

		openAuthPrompt({
			title: "Criar comunidade",
			description: "Entre para criar a página oficial da sua comunidade.",
			redirectTo: "/criar-comunidade",
		});
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border-dark bg-bg-dark/80 backdrop-blur-md">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					<Link to="/" className="flex items-center gap-2">
						<div className="w-8 h-8 flex items-center justify-center">
							<Flame className="text-brand-primary w-7 h-7" />
						</div>
						<span className="font-display text-xl font-bold tracking-wider text-white">
							Templo
						</span>
					</Link>

					<div className="flex items-center gap-4 min-w-[220px] justify-end">
						{isSessionLoading ? (
							<div className="h-8 w-[160px] rounded-md bg-white/5 animate-pulse" />
						) : !session ? (
							<button
								type="button"
								onClick={handleLogin}
								disabled={isAuthLoading}
								className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
							>
								<LogIn className="w-4 h-4" />
								{isAuthLoading ? "Entrando..." : "Entrar"}
							</button>
						) : (
							<>
								<button
									type="button"
									onClick={handleCreateCommunity}
									className="btn-primary flex items-center gap-2 text-sm py-1.5"
								>
									<PlusCircle className="w-4 h-4" />
									<span className="hidden sm:inline">Criar comunidade</span>
								</button>
								<Link
									to="/perfil/$profileFullName"
									params={{ profileFullName }}
									className="text-sm font-medium text-gray-300 hover:text-brand-primary transition-colors flex items-center gap-2"
								>
									<UserIcon className="w-4 h-4" /> Perfil
								</Link>
							</>
						)}
					</div>
				</div>
			</nav>
		</header>
	);
}
