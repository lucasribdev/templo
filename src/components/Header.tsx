import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Flame, LogIn, PlusCircle, UserIcon } from "lucide-react";
import { useAuthPrompt } from "@/components/AuthPrompt";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
	const { isSessionLoading, session } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();

	const navigate = useNavigate();
	const pathname = useLocation({ select: (location) => location.pathname });
	const isLoginRoute = pathname === "/entrar";
	const metadata = session?.user.user_metadata;
	const profileFullName =
		typeof metadata?.full_name === "string"
			? metadata.full_name
			: typeof metadata?.name === "string"
				? metadata.name
				: typeof metadata?.user_name === "string"
					? metadata.user_name
					: undefined;

	const handleLogin = () => {
		openAuthPrompt({
			redirectTo: "/",
		});
	};

	const handleCreateCommunity = () => {
		if (session) {
			navigate({ to: "/criar-comunidade" });
			return;
		}

		openAuthPrompt({
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
						) : !session && !isLoginRoute ? (
							<button
								type="button"
								onClick={handleLogin}
								className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-primary"
							>
								<LogIn className="w-4 h-4" />
								Entrar
							</button>
						) : !session ? null : profileFullName ? (
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
						) : (
							<button
								type="button"
								onClick={handleCreateCommunity}
								className="btn-primary flex items-center gap-2 text-sm py-1.5"
							>
								<PlusCircle className="w-4 h-4" />
								<span className="hidden sm:inline">Criar comunidade</span>
							</button>
						)}
					</div>
				</div>
			</nav>
		</header>
	);
}
