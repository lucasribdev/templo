import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	type SearchSchemaInput,
	useNavigate,
} from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useAuthPrompt } from "@/components/AuthPromptModal";
import CategoryArtwork from "@/components/CategoryArtwork";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import { createCommunity, getCategories, getCategoryBySlug } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isValidDiscordInvite, normalizeDiscordInvite } from "@/utils/discord";

type CreateCommunitySearch = {
	category?: string;
};

const pageSize = 20;
const categoryOptionSkeletonIds = [
	"create-category-1",
	"create-category-2",
	"create-category-3",
	"create-category-4",
	"create-category-5",
	"create-category-6",
];

function CategoryOptionSkeleton() {
	return (
		<div className="glass-panel p-4 flex flex-col items-center gap-3">
			<Skeleton className="h-12 w-12 rounded-lg" />
			<Skeleton className="h-4 w-20" />
		</div>
	);
}

export const Route = createFileRoute("/criar-comunidade")({
	validateSearch: (search: CreateCommunitySearch & SearchSchemaInput) => ({
		category: typeof search.category === "string" ? search.category : undefined,
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const [step, setStep] = useState(1);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
		null,
	);
	const [tagInput, setTagInput] = useState("");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const tagsInputId = useId();
	const navigate = useNavigate();
	const { isSessionLoading, session } = useAuth();
	const { openAuthPrompt } = useAuthPrompt();
	const { category: searchCategory } = Route.useSearch();

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [search]);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: isCategoriesLoading,
	} = useInfiniteQuery({
		queryKey: ["categories", debouncedSearch],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) =>
			getCategories({
				signal,
				limit: pageSize,
				offset: pageParam,
				search: debouncedSearch,
			}),
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < pageSize) return undefined;
			return allPages.flat().length;
		},
	});

	const categories = data?.pages.flat() ?? [];
	const { data: selectedCategoryFromSlug } = useQuery({
		queryKey: ["category", searchCategory],
		queryFn: ({ signal }) => getCategoryBySlug(searchCategory ?? "", signal),
		enabled: Boolean(searchCategory),
	});

	useEffect(() => {
		if (!searchCategory) return;

		const matchedCategory =
			categories.find((category) => category.slug === searchCategory) ??
			selectedCategoryFromSlug;

		if (matchedCategory) {
			setSelectedCategory(matchedCategory.id);
			setSuggestedCategory(null);
			setSearch((current) => current || matchedCategory.name);
			setStep(2);
		}
	}, [categories, searchCategory, selectedCategoryFromSlug]);
	const setLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>({
		disabled: step !== 1,
		hasNextPage,
		isFetchingNextPage,
		onLoadMore: fetchNextPage,
	});

	const communityForm = useForm({
		defaultValues: {
			title: "",
			description: "",
			discord_invite: "",
			tags: [] as string[],
		},
		onSubmit: async ({ value }) => {
			if (!selectedCategory && !suggestedCategory?.trim()) {
				setStep(1);
				return;
			}

			if (!session?.user?.id) {
				openAuthPrompt({
					title: "Cadastrar comunidade",
					description:
						"Você precisa estar autenticado para cadastrar uma comunidade.",
					redirectTo: "/criar-comunidade",
				});
				return;
			}

			if (!session.access_token) {
				alert("Sessão inválida. Faça login novamente.");
				return;
			}

			const createdCommunity = await createCommunity({
				categoryId: selectedCategory ?? undefined,
				suggestedCategoryName: suggestedCategory?.trim() || undefined,
				title: value.title,
				description: value.description,
				discordInvite: normalizeDiscordInvite(value.discord_invite) ?? "",
				tags: value.tags,
			});

			navigate({
				to: "/comunidades/$slug",
				params: { slug: createdCommunity.slug },
			});
		},
	});

	useEffect(() => {
		if (isSessionLoading || session) return;

		openAuthPrompt({
			title: "Cadastrar comunidade",
			description:
				"Você precisa estar autenticado para cadastrar uma comunidade.",
			redirectTo: "/criar-comunidade",
		});
	}, [isSessionLoading, session, openAuthPrompt]);

	if (isSessionLoading) {
		return (
			<div className="max-w-3xl mx-auto px-4 py-12">
				<div className="glass-panel p-10 text-center">
					<p className="text-gray-400">Carregando sessão...</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="max-w-3xl mx-auto px-4 py-12">
				<div className="h-48" />
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<div className="mb-12 space-y-4 text-center">
				<h1 className="text-4xl font-bold tracking-tight">
					Cadastrar nova comunidade
				</h1>
				<div className="flex justify-center gap-4">
					{[1, 2].map((s) => (
						<div
							key={s}
							className={cn(
								"w-12 h-1.5 rounded-full transition-all",
								step >= s ? "bg-brand-primary" : "bg-border-dark",
							)}
						/>
					))}
				</div>
			</div>
			<AnimatePresence mode="wait">
				{step === 1 && (
					<motion.div
						key="step1"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<h2 className="text-2xl font-bold text-center">
							Qual é a categoria?
						</h2>

						<div className="relative max-w-md mx-auto">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
							<input
								type="text"
								placeholder="Buscar categoria..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-bg-dark border border-border-dark rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-primary"
							/>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{isCategoriesLoading
								? categoryOptionSkeletonIds.map((id) => (
										<CategoryOptionSkeleton key={id} />
									))
								: categories?.map((category) => (
										<button
											type="button"
											key={category.id}
											onClick={() => {
												setSelectedCategory(category.id);
												setSuggestedCategory(null);
												setStep(2);
											}}
											className={cn(
												"glass-panel p-4 flex flex-col items-center gap-3 transition-all hover:border-brand-primary",
												selectedCategory === category.id &&
													"border-brand-primary bg-brand-primary/5",
											)}
										>
											<CategoryArtwork
												category={category}
												variant="thumb"
												className="w-12 h-12 rounded-lg"
											/>
											<span className="font-bold text-sm">{category.name}</span>
										</button>
									))}
							{!isCategoriesLoading &&
								search.trim() &&
								categories?.length === 0 && (
									<div className="col-span-full py-8 text-center space-y-4">
										<p className="text-gray-500">
											Não encontrou a categoria "{search}"?
										</p>
										<button
											type="button"
											onClick={() => {
												const normalizedSuggestion = search.trim();
												toast(`Categoria sugerida: ${normalizedSuggestion}`);
												setSuggestedCategory(normalizedSuggestion);
												setSelectedCategory(null);
												setStep(2);
											}}
											className="btn-primary px-6 py-2 text-sm"
										>
											Sugerir e Continuar
										</button>
									</div>
								)}
						</div>
						<div ref={setLoadMoreNode} className="h-1 w-full" />
					</motion.div>
				)}

				{step === 2 && (
					<motion.div
						key="step2"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<h2 className="text-2xl font-bold text-center">
							Preencha os detalhes
						</h2>
						<form
							className="glass-panel p-8 space-y-6"
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void communityForm.handleSubmit();
							}}
						>
							<communityForm.Field
								name="title"
								validators={{
									onChange: ({ value }) => {
										if (!value.trim()) return "Título é obrigatório";
										if (value.trim().length < 6) return "Mínimo 6 caracteres";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<label
											htmlFor={field.name}
											className="text-xs font-bold text-gray-500 uppercase"
										>
											Título da comunidade
										</label>
										<input
											id={field.name}
											name={field.name}
											type="text"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Ex: Servidor Hardcore PVP"
											className="w-full bg-bg-dark border border-border-dark rounded-lg p-3 focus:outline-none focus:border-brand-primary"
										/>
										{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0 && (
												<p className="text-xs text-red-400">
													{String(field.state.meta.errors[0])}
												</p>
											)}
									</div>
								)}
							</communityForm.Field>

							<communityForm.Field
								name="description"
								validators={{
									onChange: ({ value }) => {
										if (!value.trim()) return "Descrição é obrigatória";
										if (value.trim().length < 20) return "Mínimo 20 caracteres";
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<label
											htmlFor={field.name}
											className="text-xs font-bold text-gray-500 uppercase"
										>
											Descrição
										</label>
										<textarea
											id={field.name}
											name={field.name}
											rows={4}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Conte mais sobre o que você está oferecendo..."
											className="w-full bg-bg-dark border border-border-dark rounded-lg p-3 focus:outline-none focus:border-brand-primary"
										/>
										{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0 && (
												<p className="text-xs text-red-400">
													{String(field.state.meta.errors[0])}
												</p>
											)}
									</div>
								)}
							</communityForm.Field>

							<communityForm.Field
								name="discord_invite"
								validators={{
									onChange: ({ value }) => {
										if (!value.trim()) return "Discord é obrigatório";
										if (!isValidDiscordInvite(value)) {
											return "Use um link válido do Discord";
										}
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<label
											htmlFor={field.name}
											className="text-xs font-bold text-gray-500 uppercase"
										>
											Link do Discord
										</label>
										<input
											id={field.name}
											name={field.name}
											type="text"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://discord.gg/..."
											className="w-full bg-bg-dark border border-border-dark rounded-lg p-3 focus:outline-none focus:border-brand-primary"
										/>
										{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0 && (
												<p className="text-xs text-red-400">
													{String(field.state.meta.errors[0])}
												</p>
											)}
									</div>
								)}
							</communityForm.Field>
							<communityForm.Field name="tags">
								{(field) => {
									const handleAddTag = (
										event: KeyboardEvent<HTMLInputElement>,
									) => {
										if (event.key !== "Enter") return;
										event.preventDefault();

										const normalizedTag = tagInput.trim().replace(/\s+/g, "-");
										if (!normalizedTag) return;

										const alreadyExists = field.state.value.some(
											(tag) =>
												tag.toLowerCase() === normalizedTag.toLowerCase(),
										);
										if (alreadyExists) {
											setTagInput("");
											return;
										}

										field.handleChange([...field.state.value, normalizedTag]);
										setTagInput("");
									};

									const removeTag = (tagToRemove: string) => {
										field.handleChange(
											field.state.value.filter((tag) => tag !== tagToRemove),
										);
									};

									return (
										<div className="space-y-2">
											<label
												htmlFor={tagsInputId}
												className="text-xs font-bold text-gray-500 uppercase"
											>
												Tags (pressione Enter para adicionar)
											</label>
											<input
												id={tagsInputId}
												type="text"
												value={tagInput}
												onChange={(event) => setTagInput(event.target.value)}
												onKeyDown={handleAddTag}
												placeholder="Ex: PVP, Hardcore, Vanilla"
												className="w-full bg-bg-dark border border-border-dark rounded-lg p-3 focus:outline-none focus:border-brand-primary"
											/>
											<div className="flex flex-wrap gap-2 mt-2">
												{field.state.value.map((tag) => (
													<span
														key={tag}
														className="flex items-center gap-1 text-xs bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-full border border-brand-primary/20"
													>
														#{tag}
														<button
															type="button"
															onClick={() => removeTag(tag)}
															className="hover:text-white transition-colors"
														>
															<X className="w-3 h-3" />
														</button>
													</span>
												))}
											</div>
										</div>
									);
								}}
							</communityForm.Field>

							<communityForm.Subscribe
								selector={(state) => ({
									canSubmit: state.canSubmit,
									isSubmitting: state.isSubmitting,
								})}
							>
								{({ canSubmit, isSubmitting }) => (
									<button
										type="submit"
										disabled={!canSubmit || isSubmitting}
										className={cn(
											"btn-primary w-full py-4 text-lg",
											(!canSubmit || isSubmitting) &&
												"opacity-60 cursor-not-allowed",
										)}
									>
										{isSubmitting ? "Publicando..." : "Publicar comunidade"}
									</button>
								)}
							</communityForm.Subscribe>
						</form>
						<button
							type="button"
							onClick={() => setStep(1)}
							className="text-gray-500 hover:text-white text-sm font-bold block mx-auto"
						>
							Voltar
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
