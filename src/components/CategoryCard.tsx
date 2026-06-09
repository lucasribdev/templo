import { Link } from "@tanstack/react-router";
import type { Category } from "@/types";

export default function CategoryCard({ category }: { category: Category }) {
	return (
		<Link
			to="/categorias/$slug"
			params={{ slug: category.slug }}
			className="group"
		>
			<div className="flex flex-col justify-between glass-panel h-full p-4 transition-all group-hover:border-brand-primary">
				<h3 className="text-sm font-bold text-white tracking-wide">
					{category.name}
				</h3>
			</div>
		</Link>
	);
}
