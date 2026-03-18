import type { AuthError, Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { supabase } from "@/utils/supabase";

type AuthContextValue = {
	session: Session | null;
	isSessionLoading: boolean;
	signInWithDiscord: (
		redirectTo?: string,
	) => Promise<{ error: AuthError | null }>;
	signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [isSessionLoading, setIsSessionLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const loadSession = async () => {
			const { data } = await supabase.auth.getSession();
			if (!isMounted) return;
			setSession(data.session ?? null);
			setIsSessionLoading(false);
		};

		loadSession();

		const { data } = supabase.auth.onAuthStateChange((_event, next) => {
			if (!isMounted) return;
			setSession(next);
			setIsSessionLoading(false);
		});

		return () => {
			isMounted = false;
			data.subscription.unsubscribe();
		};
	}, []);

	const signInWithDiscord = useCallback(async (redirectTo = "/") => {
		if (typeof window === "undefined") {
			return { error: null };
		}

		const { error } = await supabase.auth.signInWithOAuth({
			provider: "discord",
			options: { redirectTo },
		});

		return { error };
	}, []);

	const signOut = useCallback(async () => {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			setSession(null);
		}
		return { error };
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			session,
			isSessionLoading,
			signInWithDiscord,
			signOut,
		}),
		[session, isSessionLoading, signInWithDiscord, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}
