import { useNavigate } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
} from "react";

type AuthPromptOptions = {
	redirectTo?: string;
};

type AuthPromptContextValue = {
	openAuthPrompt: (options?: AuthPromptOptions) => void;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

function getCurrentPath() {
	if (typeof window === "undefined") return "/";
	return `${window.location.pathname}${window.location.search}`;
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
	const navigate = useNavigate();

	const openAuthPrompt = useCallback(
		(options?: AuthPromptOptions) => {
			navigate({
				to: "/entrar",
				search: {
					redirectTo: options?.redirectTo ?? getCurrentPath(),
				},
			});
		},
		[navigate],
	);

	const value = useMemo(() => ({ openAuthPrompt }), [openAuthPrompt]);

	return (
		<AuthPromptContext.Provider value={value}>
			{children}
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
