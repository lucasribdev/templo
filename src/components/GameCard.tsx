import { Link } from "@tanstack/react-router";
import GameArtwork from "@/components/GameArtwork";
import type { Game } from "@/types";

export default function GameCard({ game }: { game: Game }) {
	return (
		<Link to="/games/$slug" params={{ slug: game.slug }} className="group">
			<div className="relative aspect-video rounded-xl overflow-hidden border border-border-dark">
				<GameArtwork
					game={game}
					variant="card"
					className="transition-transform duration-500 group-hover:scale-110"
				/>

				<div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent flex flex-col justify-end p-3">
					<h3 className="text-sm font-bold text-white tracking-wide">
						{game.name}
					</h3>
					<div className="flex gap-2 pt-2">
						{game.genres?.slice(0, 2).map((genre) => (
							<span
								key={genre}
								className="text-xs bg-brand-primary/20 backdrop-blur-sm text-brand-primary px-2 py-0.5 rounded-md border border-brand-primary/30"
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
