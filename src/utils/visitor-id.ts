const VISITOR_ID_STORAGE_KEY = "pt.visitor-id";

function createVisitorId() {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}

	return `visitor-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getOrCreateVisitorId() {
	if (typeof window === "undefined") {
		return "";
	}

	const visitorId = createVisitorId();

	try {
		const storedVisitorId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);

		if (storedVisitorId) {
			return storedVisitorId;
		}

		window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
	} catch {
		return visitorId;
	}

	return visitorId;
}
