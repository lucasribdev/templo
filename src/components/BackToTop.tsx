import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const toggleVisible = () => {
			const scrolled = document.documentElement.scrollTop;
			if (scrolled > 500) {
				setVisible(true);
			} else if (scrolled <= 500) {
				setVisible(false);
			}
		};
		window.addEventListener("scroll", toggleVisible);
		return () => window.removeEventListener("scroll", toggleVisible);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Voltar ao topo"
			className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full btn-primary text-black shadow-lg shadow-brand-primary/20 flex items-center justify-center transition-all duration-200 ${
				visible
					? "translate-y-0 scale-100 opacity-100"
					: "pointer-events-none translate-y-5 scale-90 opacity-0"
			}`}
		>
			<ChevronRight className="w-6 h-6 -rotate-90" />
		</button>
	);
}
