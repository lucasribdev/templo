import { createFileRoute, Link } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/metadata";

export const Route = createFileRoute("/termos-de-uso")({
	head: () =>
		buildPageHead({
			path: "/termos-de-uso",
			title: "Termos de Uso - Templo",
			description:
				"Conheça as regras para usar o Templo, publicar anúncios e interagir com outros jogadores.",
		}),
	component: TermsOfUse,
});

function TermsOfUse() {
	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<article className="space-y-10">
				<header className="space-y-4">
					<p className="text-xs font-bold tracking-[0.3em] text-brand-primary uppercase">
						Termos
					</p>
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight">
						Termos de Uso
					</h1>
					<p className="text-gray-400">
						Última atualização: 29 de maio de 2026
					</p>
				</header>

				<div className="glass-panel p-6 md:p-8 space-y-8 text-gray-300 leading-7">
					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">1. Aceitação</h2>
						<p>
							Ao acessar ou usar o Templo, você concorda com estes Termos de Uso
							e com a nossa{" "}
							<Link
								to="/privacidade"
								className="text-brand-primary hover:underline"
							>
								Política de Privacidade
							</Link>
							. Se você não concordar, não use a plataforma.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">2. O serviço</h2>
						<p>
							O Templo permite descobrir, publicar e acessar anúncios
							relacionados a servidores, clãs, guildas, comunidades e grupos de
							jogadores. A plataforma atua como espaço de divulgação e conexão
							entre usuários.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							3. Conta e autenticação
						</h2>
						<p>
							Alguns recursos exigem login por Discord. Você é responsável por
							manter sua conta segura, por todas as atividades feitas a partir
							da sua sessão e por fornecer informações corretas ao publicar
							conteúdo.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							4. Regras de conduta
						</h2>
						<p>Ao usar o Templo, você concorda em não:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>
								publicar conteúdo ilegal, enganoso, ofensivo, discriminatório ou
								abusivo;
							</li>
							<li>
								promover assédio, ameaças, exploração, discurso de ódio ou
								violência;
							</li>
							<li>
								divulgar malware, golpes, phishing, spam ou links maliciosos;
							</li>
							<li>publicar dados pessoais de terceiros sem autorização;</li>
							<li>
								se passar por outra pessoa, comunidade, marca ou organização;
							</li>
							<li>
								tentar comprometer a segurança, disponibilidade ou integridade
								da plataforma.
							</li>
						</ul>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							5. Anúncios e conteúdo do usuário
						</h2>
						<p>
							Você mantém seus direitos sobre o conteúdo que publica, mas
							concede ao Templo permissão para hospedar, exibir, organizar,
							adaptar e distribuir esse conteúdo dentro da plataforma. Você
							declara que tem direito de publicar as informações enviadas e que
							elas não violam direitos de terceiros.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							6. Moderação e remoção
						</h2>
						<p>
							Podemos remover, ocultar, limitar ou desativar anúncios, perfis ou
							contas que violem estes termos, prejudiquem outros usuários, gerem
							risco à plataforma ou estejam em desacordo com a proposta do
							Templo.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							7. Privacidade e cookies
						</h2>
						<p>
							O uso do Templo também é regido pela nossa{" "}
							<Link
								to="/privacidade"
								className="text-brand-primary hover:underline"
							>
								Política de Privacidade
							</Link>
							. Usamos recursos essenciais para manter login, segurança,
							preferências e funcionamento da plataforma. Recursos opcionais de
							análise, incluindo Google Analytics, só são ativados depois do seu
							consentimento no banner de cookies.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							8. Serviços e links de terceiros
						</h2>
						<p>
							Anúncios podem direcionar para Discord, servidores de jogos e
							outros serviços externos. O Templo não controla esses ambientes e
							não se responsabiliza por regras, disponibilidade, segurança,
							pagamentos, conteúdos ou interações que ocorram fora da
							plataforma.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">9. Disponibilidade</h2>
						<p>
							Buscamos manter o serviço disponível e funcional, mas não
							garantimos operação ininterrupta, livre de erros ou compatível com
							todos os dispositivos. Podemos alterar, suspender ou encerrar
							recursos a qualquer momento.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							10. Limitação de responsabilidade
						</h2>
						<p>
							O Templo é fornecido no estado em que se encontra. Na máxima
							extensão permitida por lei, não nos responsabilizamos por perdas,
							danos, conflitos entre usuários, problemas em servidores externos
							ou decisões tomadas com base em conteúdo publicado por terceiros.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">
							11. Alterações dos termos
						</h2>
						<p>
							Podemos atualizar estes termos para refletir mudanças no serviço,
							nas regras da comunidade ou na legislação aplicável. A versão mais
							recente estará sempre disponível nesta página.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-bold text-white">12. Contato</h2>
						<p>
							Para dúvidas, denúncias ou solicitações relacionadas a estes
							termos, entre em contato pelos canais indicados na plataforma.
						</p>
					</section>
				</div>

				<div className="flex flex-wrap gap-3">
					<Link to="/" className="btn-secondary">
						Voltar para a home
					</Link>
					<Link to="/privacidade" className="btn-primary">
						Ver política de privacidade
					</Link>
				</div>
			</article>
		</div>
	);
}
