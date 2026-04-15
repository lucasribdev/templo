import { cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { getTypeStyles, getTypeText } from "@/utils/listing-type";

export default function ListingTypeBadge({ type }: { type: Listing["type"] }) {
	return (
		<div
			className={cn(
				"px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
				getTypeStyles(type),
			)}
		>
			{getTypeText(type)}
		</div>
	);
}
