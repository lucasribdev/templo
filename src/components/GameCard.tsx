import { Link } from "@tanstack/react-router";
import type { Game } from "@/types";

export default function GameCard({ game }: { game: Game }) {
	return (
		<Link to="/games/$slug" params={{ slug: game.slug }} className="group">
			<div className="relative aspect-video rounded-xl overflow-hidden border border-border-dark">
				<img
					src={game.coverUrl}
					alt={game.name}
					className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
					referrerPolicy="no-referrer"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
					<h3 className="text-xl font-bold text-white">{game.name}</h3>
					<div className="flex gap-2 mt-2">
						{game.genres?.slice(0, 2).map((genre) => (
							<span
								key={genre}
								className="text-[10px] bg-brand-primary/20 backdrop-blur-sm text-brand-primary px-2 py-0.5 rounded border border-brand-primary/30"
							>
								{genre}
							</span>
						))}
					</div>
				</div>
			</div>
		</Link>
	);
}
