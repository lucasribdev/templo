import { cn } from "@/lib/utils";
import type { Category } from "@/types";

type CategoryArtworkVariant = "hero" | "card" | "tile" | "thumb";

interface CategoryArtworkProps {
	category: Pick<Category, "name" | "coverUrl">;
	variant?: CategoryArtworkVariant;
	className?: string;
	overlayClassName?: string;
}

const variantStyles: Record<
	CategoryArtworkVariant,
	{ container: string; initials: string; glow: string; accent: string }
> = {
	hero: {
		container:
			"bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_34%),linear-gradient(135deg,_rgba(5,10,24,0.98)_0%,_rgba(18,24,48,0.95)_38%,_rgba(88,28,135,0.82)_100%)]",
		initials:
			"text-[clamp(4rem,14vw,9rem)] tracking-[0.22em] text-white/90 drop-shadow-[0_0_24px_rgba(34,211,238,0.25)]",
		glow: "bg-cyan-400/18 blur-3xl",
		accent: "border-cyan-400/35 shadow-[0_0_40px_rgba(34,211,238,0.18)]",
	},
	card: {
		container:
			"bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.28),_transparent_36%),linear-gradient(135deg,_rgba(8,12,24,0.98)_0%,_rgba(22,34,62,0.95)_40%,_rgba(67,56,202,0.82)_100%)]",
		initials:
			"text-[clamp(2.25rem,8vw,4.5rem)] tracking-[0.2em] text-white/90 drop-shadow-[0_0_18px_rgba(16,185,129,0.28)]",
		glow: "bg-emerald-400/20 blur-2xl",
		accent: "border-emerald-400/30 shadow-[0_0_28px_rgba(16,185,129,0.16)]",
	},
	tile: {
		container:
			"bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.26),_transparent_32%),linear-gradient(135deg,_rgba(10,10,18,0.98)_0%,_rgba(29,35,64,0.94)_42%,_rgba(91,33,182,0.78)_100%)]",
		initials:
			"text-[clamp(1.15rem,4vw,1.6rem)] tracking-[0.18em] text-white/90 drop-shadow-[0_0_14px_rgba(244,114,182,0.22)]",
		glow: "bg-fuchsia-400/20 blur-xl",
		accent: "border-fuchsia-400/30 shadow-[0_0_24px_rgba(217,70,239,0.16)]",
	},
	thumb: {
		container:
			"bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.24),_transparent_34%),linear-gradient(135deg,_rgba(8,12,24,0.98)_0%,_rgba(30,41,59,0.94)_44%,_rgba(180,83,9,0.78)_100%)]",
		initials:
			"text-[clamp(0.8rem,2.4vw,1.1rem)] tracking-[0.14em] text-white/90 drop-shadow-[0_0_10px_rgba(250,204,21,0.18)]",
		glow: "bg-amber-300/20 blur-lg",
		accent: "border-amber-300/30 shadow-[0_0_20px_rgba(250,204,21,0.14)]",
	},
};

export function hasCoverUrl(category: Pick<Category, "coverUrl">) {
	return !category.coverUrl;
}

export function getCategoryInitials(name: string) {
	return name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

export default function CategoryArtwork({
	category,
	variant = "card",
	className,
	overlayClassName,
}: CategoryArtworkProps) {
	if (!hasCoverUrl(category)) {
		return (
			<img
				src={category.coverUrl}
				alt={category.name}
				className={cn("w-full h-full object-cover", className)}
				referrerPolicy="no-referrer"
			/>
		);
	}

	const styles = variantStyles[variant];
	const initials = getCategoryInitials(category.name);

	return (
		<div
			role="img"
			aria-label={category.name}
			className={cn(
				"relative w-full h-full overflow-hidden border border-white/10",
				styles.container,
				styles.accent,
				className,
			)}
		>
			<div className="absolute inset-0 opacity-70">
				<div
					className={cn(
						"absolute -left-8 top-4 h-20 w-20 rounded-full",
						styles.glow,
					)}
				/>
				<div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
				<div className="absolute inset-x-5 bottom-5 h-px bg-gradient-to-r from-cyan-300/0 via-cyan-300/50 to-cyan-300/0" />
				<div className="absolute right-4 top-4 h-8 w-8 rounded-full border border-white/15" />
				<div className="absolute bottom-4 left-4 h-10 w-10 rotate-45 border border-white/10" />
				<div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.05)_45%,transparent_100%)]" />
			</div>
			<div className={cn("absolute inset-0 bg-black/10", overlayClassName)} />
			<div className="absolute inset-0 flex items-center justify-center">
				<span className={cn("font-black uppercase", styles.initials)}>
					{initials}
				</span>
			</div>
		</div>
	);
}
