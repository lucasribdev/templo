import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Eye, Gamepad2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Game, Listing, ListingType } from "@/types";

export default function ListingCard({
	listing,
	game,
}: {
	listing: Listing;
	game?: Game;
}) {
	const navigate = useNavigate();

	const getTypeStyles = (type: ListingType) => {
		switch (type) {
			case "LFG":
				return "bg-purple-500/10 text-purple-400 border-purple-500/20";
			case "SERVER":
				return "bg-blue-500/10 text-blue-400 border-blue-500/20";
			case "COMMUNITY":
				return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
		}
	};

	const getTypeText = (type: ListingType) => {
		switch (type) {
			case "LFG":
				return "Procurando Grupo";
			case "SERVER":
				return "Servidor";
			case "COMMUNITY":
				return "Comunidade";
		}
	};

	return (
		<motion.div
			whileHover={{ y: -4 }}
			className="glass-panel p-5 flex flex-col gap-4 cursor-pointer group"
			onClick={() => navigate({ to: `/listing/${listing.id}` })}
		>
			<div className="flex justify-between items-start">
				<div
					className={cn(
						"px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
						getTypeStyles(listing.type),
					)}
				>
					{getTypeText(listing.type)}
				</div>
				{/* <button
					type="button"
					onClick={handleLike}
					className={cn(
						"flex items-center gap-1 transition-all",
						isLiked ? "text-red-500" : "text-gray-500 hover:text-red-400",
					)}
				>
					<span className="text-xs font-bold">{likesCount}</span>
					<Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
				</button> */}
			</div>

			<div>
				<h3 className="text-lg font-bold group-hover:text-brand-primary transition-colors line-clamp-1">
					{listing.title}
				</h3>
				{game && (
					<p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
						<Gamepad2 className="w-3 h-3" /> {game.name}
					</p>
				)}
			</div>

			<p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
				{listing.description}
			</p>

			<div className="flex flex-wrap gap-2 mt-auto">
				{listing.tags.slice(0, 3).map((tag) => (
					<span
						key={tag}
						className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400"
					>
						#{tag}
					</span>
				))}
			</div>

			<div className="pt-4 border-t border-border-dark flex justify-between items-center">
				<div className="flex items-center gap-3">
					<span className="text-[10px] text-gray-500 uppercase font-mono">
						{new Date(listing.createdAt).toLocaleDateString("pt-BR")}
					</span>
					<div className="flex items-center gap-1 text-[10px] text-gray-500">
						<Eye className="w-3 h-3" /> {listing.views}
					</div>
				</div>
				<div className="flex items-center gap-1 text-brand-primary text-xs font-bold">
					Ver detalhes <ChevronRight className="w-4 h-4" />
				</div>
			</div>
		</motion.div>
	);
}
