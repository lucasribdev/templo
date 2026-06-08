import { Link } from "@tanstack/react-router";
import type { Category } from "@/types";

export default function CategoryCard({ category }: { category: Category }) {
	return (
		<Link
			to="/categorias/$slug"
			params={{ slug: category.slug }}
			className="group"
		>
			<div className="glass-panel h-full min-h-28 p-4 transition-all group-hover:border-brand-primary">
				<h3 className="text-sm font-bold text-white tracking-wide">
					{category.name}
				</h3>
				<div className="flex flex-wrap gap-2 pt-3">
					{category.genres?.slice(0, 2).map((genre) => (
						<span
							key={genre}
							className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-md border border-brand-primary/30"
						>
							{genre}
						</span>
					))}
				</div>
			</div>
		</Link>
	);
}
