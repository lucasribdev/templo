import { LogIn, PlusCircle, X } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
import { useAuth } from "@/hooks/use-auth";

type AuthPromptOptions = {
	title?: string;
	description?: string;
	redirectTo?: string;
};

type AuthPromptContextValue = {
	openAuthPrompt: (options?: AuthPromptOptions) => void;
	closeAuthPrompt: () => void;
};

const defaultPrompt = {
	title: "Cadastrar comunidade",
	description: "Você precisa estar autenticado para cadastrar uma comunidade.",
	redirectTo: "/create-listing",
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

function getCurrentPath() {
	if (typeof window === "undefined") return "/";
	return `${window.location.pathname}${window.location.search}`;
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
	const [prompt, setPrompt] = useState<AuthPromptOptions>(defaultPrompt);
	const [isOpen, setIsOpen] = useState(false);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const titleId = useId();
	const { session, signInWithDiscord } = useAuth();

	const closeAuthPrompt = useCallback(() => {
		if (isSigningIn) return;
		setIsOpen(false);
	}, [isSigningIn]);

	const openAuthPrompt = useCallback((options?: AuthPromptOptions) => {
		setPrompt({
			title: options?.title ?? defaultPrompt.title,
			description: options?.description ?? defaultPrompt.description,
			redirectTo: options?.redirectTo ?? getCurrentPath(),
		});
		setIsOpen(true);
	}, []);

	useEffect(() => {
		if (session) {
			setIsOpen(false);
			setIsSigningIn(false);
		}
	}, [session]);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeAuthPrompt();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, closeAuthPrompt]);

	const handleDiscordLogin = async () => {
		if (isSigningIn) return;
		setIsSigningIn(true);

		const { error } = await signInWithDiscord(
			prompt.redirectTo ?? getCurrentPath(),
		);

		if (error) {
			window.location.href = "?error=oauth_failed";
			setIsSigningIn(false);
		}
	};

	const value = useMemo(
		() => ({ openAuthPrompt, closeAuthPrompt }),
		[openAuthPrompt, closeAuthPrompt],
	);

	return (
		<AuthPromptContext.Provider value={value}>
			{children}
			{isOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
					role="dialog"
					aria-modal="true"
					aria-labelledby={titleId}
					onMouseDown={closeAuthPrompt}
				>
					<div
						role="document"
						className="glass-panel relative w-full max-w-md p-8 text-center shadow-2xl shadow-black/40"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<button
							type="button"
							onClick={closeAuthPrompt}
							disabled={isSigningIn}
							className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Fechar modal de autenticação"
						>
							<X className="size-4" />
						</button>

						<div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
							<PlusCircle className="size-6" />
						</div>

						<div className="space-y-3">
							<h1 id={titleId} className="text-3xl font-bold tracking-tight">
								{prompt.title}
							</h1>
							<p className="text-sm leading-6 text-gray-400">
								{prompt.description}
							</p>
						</div>

						<button
							type="button"
							onClick={handleDiscordLogin}
							disabled={isSigningIn}
							className="btn-discord mt-7 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
						>
							<LogIn className="size-4" />
							{isSigningIn ? "Entrando..." : "Entrar com Discord"}
						</button>
					</div>
				</div>
			)}
		</AuthPromptContext.Provider>
	);
}

export function useAuthPrompt() {
	const ctx = useContext(AuthPromptContext);
	if (!ctx) {
		throw new Error("useAuthPrompt must be used within AuthPromptProvider");
	}
	return ctx;
}
