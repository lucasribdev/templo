import { Link, useNavigate } from "@tanstack/react-router";
import { Gamepad2, LogIn, LogOut, PlusCircle, UserIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSigningOut, setIsSigningOut] = useState(false);

	const { isSessionLoading, session, signInWithDiscord, signOut } = useAuth();

	const profileFullName = session?.user.user_metadata.full_name;

	const navigate = useNavigate();

	const handleDiscordLogin = async () => {
		if (isAuthLoading) return;
		setIsAuthLoading(true);

		const { error } = await signInWithDiscord("/");

		if (error) {
			// Fallback to auth route for a visible error state.
			window.location.href = "?error=oauth_failed";
			setIsAuthLoading(false);
		}
	};

	const handleSignOut = async () => {
		if (isSigningOut) return;
		setIsSigningOut(true);
		const { error } = await signOut();
		if (!error) {
			navigate({ to: "/" });
		}
		setIsSigningOut(false);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border-dark bg-bg-dark/80 backdrop-blur-md">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					<Link to="/" className="flex items-center gap-2">
						<div className="w-8 h-8 flex items-center justify-center">
							<Gamepad2 className="text-brand-primary w-7 h-7" />
						</div>
						<span className="font-display text-xl font-bold tracking-wider text-white">
							TEMPLO
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-6">
						<Link
							to="/"
							className="text-sm font-medium hover:text-brand-primary transition-colors"
						>
							Início
						</Link>
						<Link
							to="/games"
							className="text-sm font-medium hover:text-brand-primary transition-colors"
						>
							Jogos
						</Link>
						{!isSessionLoading && session && (
							<Link
								to="/profile/$profileFullName"
								params={{ profileFullName }}
								className="text-sm font-medium hover:text-brand-primary transition-colors flex items-center gap-2"
							>
								<UserIcon className="w-4 h-4" /> Perfil
							</Link>
						)}
					</div>

					<div className="flex items-center gap-4 min-w-[220px] justify-end">
						{isSessionLoading ? (
							<div className="h-8 w-[160px] rounded-md bg-white/5 animate-pulse" />
						) : !session ? (
							<button
								type="button"
								onClick={handleDiscordLogin}
								disabled={isAuthLoading}
								className="text-sm font-medium hover:text-brand-primary transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
							>
								<LogIn className="w-4 h-4" /> Entrar com Discord
							</button>
						) : (
							<>
								<button
									type="button"
									onClick={handleSignOut}
									disabled={isAuthLoading}
									className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
								>
									<LogOut className="w-4 h-4" /> Sair
								</button>
								<Link
									to="/create-listing"
									className="btn-primary flex items-center gap-2 text-sm py-1.5"
								>
									<PlusCircle className="w-4 h-4" />
									<span className="hidden sm:inline">Criar anúncio</span>
								</Link>
							</>
						)}
					</div>
				</div>
			</nav>
		</header>
	);
}
