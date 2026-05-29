import { createFileRoute, Link } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/metadata";

export const Route = createFileRoute("/privacidade")({
	head: () =>
		buildPageHead({
			path: "/privacidade",
			title: "Política de Privacidade - Templo",
			description:
				"Entenda quais dados o Templo coleta, como eles são usados e quais escolhas você tem ao usar a plataforma.",
		}),
	component: PrivacyPolicy,
});

function PrivacyPolicy() {
	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<article className="space-y-10">
				<header className="space-y-4">
					<p className="text-xs font-bold tracking-[0.3em] text-brand-primary uppercase">
						Privacidade
					</p>
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight">
						Política de Privacidade
					</h1>
					<p className="text-gray-400">
						Última atualização: 29 de maio de 2026
					</p>
				</header>

				<div className="glass-panel p-6 md:p-8 space-y-8 text-gray-300 leading-7">
					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">1. Visão geral</h2>
						<p>
							O Templo é uma plataforma para jogadores encontrarem servidores,
							clãs, guildas, comunidades e outros jogadores. Esta política
							explica como tratamos dados pessoais quando você acessa, cria uma
							conta ou publica anúncios na plataforma.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							2. Dados que coletamos
						</h2>
						<p>Podemos coletar e tratar os seguintes dados:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>
								dados de autenticação fornecidos pelo Discord, como
								identificador, nome de usuário, nome exibido e avatar;
							</li>
							<li>
								informações publicadas por você, como título, descrição, jogo,
								tags, convite do Discord e endereço de servidor;
							</li>
							<li>
								dados de uso da plataforma, como visualizações, curtidas,
								interações com anúncios e páginas acessadas, quando necessários
								para funcionamento ou quando você consentir com cookies de
								análise;
							</li>
							<li>
								dados técnicos necessários para segurança e funcionamento, como
								identificadores de sessão, endereço IP, navegador e registros de
								erro.
							</li>
						</ul>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							3. Como usamos os dados
						</h2>
						<p>Usamos os dados para:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>
								permitir login, criação de perfil e publicação de anúncios;
							</li>
							<li>
								exibir, organizar e recomendar conteúdos dentro da plataforma;
							</li>
							<li>
								prevenir abuso, spam, fraude e atividades que violem os termos;
							</li>
							<li>
								manter a segurança, medir desempenho e corrigir problemas
								técnicos;
							</li>
							<li>
								quando houver consentimento, entender de forma agregada como a
								plataforma é usada para melhorar navegação, conteúdo e recursos;
							</li>
							<li>
								cumprir obrigações legais ou responder a solicitações válidas.
							</li>
						</ul>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							4. Conteúdo público
						</h2>
						<p>
							Anúncios, perfis públicos, links de convite, tags, descrições e
							endereços de servidor podem ficar visíveis para outros usuários e
							visitantes. Evite publicar dados pessoais sensíveis ou informações
							que você não deseja tornar públicas.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							5. Compartilhamento de dados
						</h2>
						<p>
							Podemos compartilhar dados com provedores necessários para operar
							o Templo, incluindo serviços de autenticação, banco de dados,
							hospedagem, análise técnica, medição de audiência mediante
							consentimento e prevenção de abuso. Também podemos compartilhar
							dados quando exigido por lei ou para proteger direitos, segurança
							e integridade da plataforma.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							6. Cookies e tecnologias semelhantes
						</h2>
						<p>
							Usamos cookies, armazenamento local e identificadores semelhantes
							para manter sua sessão ativa, lembrar preferências, proteger a
							plataforma e registrar escolhas essenciais. Esses recursos
							necessários podem ser usados sem consentimento adicional porque
							sustentam o funcionamento do serviço.
						</p>
						<p>
							Cookies e scripts de análise, incluindo Google Analytics, só são
							carregados depois que você aceita essa finalidade no banner de
							cookies. Se você recusar, o Templo não injeta o Google Analytics
							no seu navegador para medir sua navegação.
						</p>
						<p>
							Você pode bloquear ou apagar cookies pelo navegador. Ao limpar o
							armazenamento local do site, o banner poderá aparecer novamente
							para que você registre uma nova escolha.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							7. Segurança e retenção
						</h2>
						<p>
							Adotamos medidas técnicas e organizacionais para proteger os
							dados. Mantemos informações pelo tempo necessário para operar o
							serviço, cumprir obrigações legais, resolver disputas, prevenir
							abuso e garantir a segurança da plataforma.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">8. Seus direitos</h2>
						<p>
							Dependendo da legislação aplicável, você pode solicitar acesso,
							correção, exclusão, portabilidade ou limitação do tratamento dos
							seus dados. Também pode encerrar sua sessão e deixar de publicar
							conteúdo na plataforma. Quando o tratamento depender de
							consentimento, você pode recusar ou retirar esse consentimento a
							qualquer momento pelos controles do navegador ou limpando a
							preferência de cookies armazenada no site.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							9. Serviços de terceiros
						</h2>
						<p>
							O Templo pode conter links para Discord, servidores de jogos,
							Google Analytics e outros serviços externos. Esses serviços têm
							suas próprias políticas, e não controlamos como terceiros tratam
							dados fora da plataforma. O Google Analytics, quando autorizado,
							pode processar identificadores, dados técnicos e eventos de
							navegação conforme as configurações do serviço.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							10. Alterações nesta política
						</h2>
						<p>
							Podemos atualizar esta política para refletir mudanças no serviço,
							nas práticas de tratamento de dados ou na legislação. A versão
							mais recente estará sempre disponível nesta página.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">11. Contato</h2>
						<p>
							Para dúvidas ou solicitações relacionadas a privacidade, entre em
							contato pelos canais indicados na plataforma.
						</p>
					</section>
				</div>

				<div className="flex flex-wrap gap-3">
					<Link to="/" className="btn-secondary">
						Voltar para a home
					</Link>
					<Link to="/termos-de-uso" className="btn-primary">
						Ver termos de uso
					</Link>
				</div>
			</article>
		</div>
	);
}
