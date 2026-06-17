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

async function getSupabase() {
	const { supabase } = await import("@/utils/supabase");
	return supabase;
}

type AuthContextValue = {
	session: Session | null;
	isSessionLoading: boolean;
	signInWithOAuthProvider: (
		provider: OAuthProvider,
		redirectTo?: string,
	) => Promise<{ error: AuthError | null }>;
	signOut: () => Promise<{ error: AuthError | null }>;
};

export type OAuthProvider = "github" | "google";

const AuthContext = createContext<AuthContextValue | null>(null);

function getRedirectUrl(redirectTo: string) {
	if (typeof window === "undefined") return redirectTo;
	return new URL(redirectTo, window.location.origin).toString();
}

function getProfileNameFromMetadata(
	metadata: Session["user"]["user_metadata"],
) {
	const name =
		typeof metadata.full_name === "string"
			? metadata.full_name
			: typeof metadata.name === "string"
				? metadata.name
				: typeof metadata.user_name === "string"
					? metadata.user_name
					: undefined;

	return name?.trim() || undefined;
}

function getProfileUpdatesFromSession(session: Session) {
	const metadata = session.user.user_metadata;
	const provider =
		typeof session.user.app_metadata.provider === "string"
			? session.user.app_metadata.provider
			: undefined;
	const avatarUrl =
		typeof metadata.avatar_url === "string"
			? metadata.avatar_url
			: typeof metadata.picture === "string"
				? metadata.picture
				: undefined;
	const providerId =
		typeof metadata.provider_id === "string"
			? metadata.provider_id
			: typeof metadata.sub === "string"
				? metadata.sub
				: undefined;

	return {
		full_name: getProfileNameFromMetadata(metadata),
		avatar_url: avatarUrl,
		auth_provider: provider,
		auth_provider_id: providerId,
	};
}

async function syncProfileFromSession(session: Session) {
	const updates = getProfileUpdatesFromSession(session);
	const supabase = await getSupabase();

	await supabase.from("profiles").update(updates).eq("id", session.user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [isSessionLoading, setIsSessionLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const loadSession = async () => {
			const supabase = await getSupabase();
			const { data } = await supabase.auth.getSession();
			if (!isMounted) return;
			setSession(data.session ?? null);
			setIsSessionLoading(false);
			if (data.session) {
				void syncProfileFromSession(data.session);
			}
		};

		loadSession();

		let unsubscribe: (() => void) | undefined;

		getSupabase().then((supabase) => {
			if (!isMounted) return;

			const { data } = supabase.auth.onAuthStateChange((_event, next) => {
				if (!isMounted) return;
				setSession(next);
				setIsSessionLoading(false);
				if (next) {
					void syncProfileFromSession(next);
				}
			});

			unsubscribe = () => data.subscription.unsubscribe();
		});

		return () => {
			isMounted = false;
			unsubscribe?.();
		};
	}, []);

	const signInWithOAuthProvider = useCallback(
		async (provider: OAuthProvider, redirectTo = "/") => {
			if (typeof window === "undefined") {
				return { error: null };
			}

			const supabase = await getSupabase();
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: getRedirectUrl(redirectTo) },
			});

			return { error };
		},
		[],
	);

	const signOut = useCallback(async () => {
		const supabase = await getSupabase();
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
			signInWithOAuthProvider,
			signOut,
		}),
		[session, isSessionLoading, signInWithOAuthProvider, signOut],
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
