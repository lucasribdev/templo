import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	type SearchSchemaInput,
	useNavigate,
} from "@tanstack/react-router";
import { MessageSquare, Search, Server, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import GameArtwork from "@/components/GameArtwork";
import TypeOption from "@/components/TypeOption";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useInfiniteScrollTrigger } from "@/hooks/use-infinite-scroll-trigger";
import { createListing, getGameBySlug, getGames } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ListingType } from "@/types";
import { isValidDiscordInvite, normalizeDiscordInvite } from "@/utils/discord";

type CreateListingSearch = {
	game?: string;
};

const pageSize = 20;
const gameOptionSkeletonIds = [
	"create-game-1",
	"create-game-2",
	"create-game-3",
	"create-game-4",
	"create-game-5",
	"create-game-6",
];

function GameOptionSkeleton() {
	return (
		<div className="glass-panel p-4 flex flex-col items-center gap-3">
			<Skeleton className="h-12 w-12 rounded-lg" />
			<Skeleton className="h-4 w-20" />
		</div>
	);
}

export const Route = createFileRoute("/create-listing")({
	validateSearch: (search: CreateListingSearch & SearchSchemaInput) => ({
		game: typeof search.game === "string" ? search.game : undefined,
	}),
	component: RouteComponent,
});

function isValidServerAddress(value: string) {
	const addressParts = value.trim().split(":");
	if (addressParts.length > 2) return false;

	const [host, port] = addressParts;
	if (!host) return false;

	if (port) {
		if (!/^\d+$/.test(port)) return false;
		const portNumber = Number(port);
		if (portNumber < 1 || portNumber > 65535) return false;
	}

	const ipv4Pattern =
		/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
	const hostnamePattern =
		/^(localhost|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;

	return ipv4Pattern.test(host) || hostnamePattern.test(host);
}

function RouteComponent() {
	const [step, setStep] = useState(1);
	const [type, setType] = useState<ListingType | null>(null);
	const [selectedGame, setSelectedGame] = useState<string | null>(null);
	const [suggestedGame, setSuggestedGame] = useState<string | null>(null);
	const [tagInput, setTagInput] = useState("");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const tagsInputId = useId();
	const navigate = useNavigate();
	const { isSessionLoading, session, signInWithDiscord } = useAuth();
	const { game: searchGame } = Route.useSearch();

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
		isLoading: isGamesLoading,
	} = useInfiniteQuery({
		queryKey: ["games", debouncedSearch],
		initialPageParam: 0,
		queryFn: ({ pageParam, signal }) =>
			getGames({
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

	const games = data?.pages.flat() ?? [];
	const { data: selectedGameFromSlug } = useQuery({
		queryKey: ["game", searchGame],
		queryFn: ({ signal }) => getGameBySlug(searchGame ?? "", signal),
		enabled: Boolean(searchGame),
	});

	useEffect(() => {
		if (!searchGame) return;

		const matchedGame =
			games.find((game) => game.slug === searchGame) ?? selectedGameFromSlug;

		if (matchedGame) {
			setSelectedGame(matchedGame.id);
			setSuggestedGame(null);
			setSearch((current) => current || matchedGame.name);
		}
	}, [games, searchGame, selectedGameFromSlug]);
	const setLoadMoreNode = useInfiniteScrollTrigger<HTMLDivElement>({
		disabled: step !== 2,
		hasNextPage,
		isFetchingNextPage,
		onLoadMore: fetchNextPage,
	});

	const listingForm = useForm({
		defaultValues: {
			title: "",
			description: "",
			discord_invite: "",
			ip: "",
			tags: [] as string[],
		},
		onSubmit: async ({ value }) => {
			if (!type) {
				setStep(1);
				return;
			}

			if (!selectedGame && !suggestedGame?.trim()) {
				setStep(2);
				return;
			}

			if (!session?.user?.id) {
				alert("Faça login para publicar um anúncio.");
				return;
			}

			if (!session.access_token) {
				alert("Sessão inválida. Faça login novamente.");
				return;
			}

			const createdListing = await createListing({
				gameId: selectedGame ?? undefined,
				suggestedGameName: suggestedGame?.trim() || undefined,
				type,
				title: value.title,
				description: value.description,
				discordInvite: normalizeDiscordInvite(value.discord_invite) ?? "",
				ip: type === "SERVER" ? value.ip : undefined,
				tags: value.tags,
			});

			navigate({
				to: "/listings/$slug",
				params: { slug: createdListing.slug },
			});
		},
	});

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
				<div className="glass-panel p-10 text-center space-y-4">
					<h1 className="text-3xl font-bold tracking-tight">Criar anúncio</h1>
					<p className="text-gray-400">
						Você precisa estar autenticado para criar um anúncio.
					</p>
					<button
						type="button"
						onClick={() => void signInWithDiscord("/create-listing")}
						className="btn-primary"
					>
						Entrar com Discord
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<div className="mb-12 space-y-4 text-center">
				<h1 className="text-4xl font-bold tracking-tight">
					Criar novo anúncio
				</h1>
				<div className="flex justify-center gap-4">
					{[1, 2, 3].map((s) => (
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
							O que você quer anunciar?
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<TypeOption
								icon={<Server className="w-8 h-8" />}
								title="Servidor"
								desc="Divulgue seu servidor multiplayer"
								active={type === "SERVER"}
								onClick={() => {
									setType("SERVER");
									setStep(2);
								}}
							/>
							<TypeOption
								icon={<Users className="w-8 h-8" />}
								title="Comunidade"
								desc="Encontre membros para sua guilda ou clã"
								active={type === "COMMUNITY"}
								onClick={() => {
									setType("COMMUNITY");
									setStep(2);
								}}
							/>
							<TypeOption
								icon={<MessageSquare className="w-8 h-8" />}
								title="LFG"
								desc="Procure um grupo para jogar agora"
								active={type === "LFG"}
								onClick={() => {
									setType("LFG");
									setStep(2);
								}}
							/>
						</div>
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
						<h2 className="text-2xl font-bold text-center">Qual é o jogo?</h2>

						<div className="relative max-w-md mx-auto">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
							<input
								type="text"
								placeholder="Buscar jogo..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-bg-dark border border-border-dark rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-primary"
							/>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{isGamesLoading
								? gameOptionSkeletonIds.map((id) => (
										<GameOptionSkeleton key={id} />
									))
								: games?.map((game) => (
										<button
											type="button"
											key={game.id}
											onClick={() => {
												setSelectedGame(game.id);
												setSuggestedGame(null);
												setStep(3);
											}}
											className={cn(
												"glass-panel p-4 flex flex-col items-center gap-3 transition-all hover:border-brand-primary",
												selectedGame === game.id &&
													"border-brand-primary bg-brand-primary/5",
											)}
										>
											<GameArtwork
												game={game}
												variant="thumb"
												className="w-12 h-12 rounded-lg"
											/>
											<span className="font-bold text-sm">{game.name}</span>
										</button>
									))}
							{!isGamesLoading && search.trim() && games?.length === 0 && (
								<div className="col-span-full py-8 text-center space-y-4">
									<p className="text-gray-500">
										Não encontrou o jogo "{search}"?
									</p>
									<button
										type="button"
										onClick={() => {
											const normalizedSuggestion = search.trim();
											toast(`Jogo sugerido: ${normalizedSuggestion}`);
											setSuggestedGame(normalizedSuggestion);
											setSelectedGame(null);
											setStep(3);
										}}
										className="btn-primary px-6 py-2 text-sm"
									>
										Sugerir e Continuar
									</button>
								</div>
							)}
						</div>
						<div ref={setLoadMoreNode} className="h-1 w-full" />
						<button
							type="button"
							onClick={() => setStep(1)}
							className="text-gray-500 hover:text-white text-sm font-bold block mx-auto"
						>
							Voltar
						</button>
					</motion.div>
				)}

				{step === 3 && (
					<motion.div
						key="step3"
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
								void listingForm.handleSubmit();
							}}
						>
							<listingForm.Field
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
											Título do anúncio
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
							</listingForm.Field>

							<listingForm.Field
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
							</listingForm.Field>

							<div className="grid grid-cols-2 gap-4">
								<listingForm.Field
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
										<div
											className={`space-y-2 ${type !== "SERVER" ? "col-span-2" : ""}`}
										>
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
								</listingForm.Field>

								{type === "SERVER" && (
									<listingForm.Field
										name="ip"
										validators={{
											onChange: ({ value }) => {
												if (value.trim() && !isValidServerAddress(value.trim()))
													return "Use um IP/host válido (ex: 192.168.0.10:2456)";
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
													IP do Servidor
												</label>
												<input
													id={field.name}
													name={field.name}
													type="text"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="Ex: 192.168.1.1:2456"
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
									</listingForm.Field>
								)}
							</div>
							<listingForm.Field name="tags">
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
							</listingForm.Field>

							<listingForm.Subscribe
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
										{isSubmitting ? "Publicando..." : "Publicar anúncio"}
									</button>
								)}
							</listingForm.Subscribe>
						</form>
						<button
							type="button"
							onClick={() => setStep(2)}
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
