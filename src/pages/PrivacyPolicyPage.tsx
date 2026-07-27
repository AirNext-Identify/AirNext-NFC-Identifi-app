import {
  Eye,
  Shield,
  Share2,
  Lock,
  Settings2,
  Users,
  FileText,
  Database,
} from 'lucide-react';
import {
  LegalLayout,
  LegalSectionBlock,
  LegalCard,
  LegalAccordion,
} from '../components/legal/LegalLayout';
import { DOCUMENT_META, DOCUMENT_VERSIONS, LEGAL_CONFIG, PROFILE_TYPES } from '../config/legal';

const SECTIONS = [
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'seus-dados', label: 'Seus dados' },
  { id: 'como-usamos', label: 'Como usamos' },
  { id: 'compartilhamento', label: 'Compartilhamento' },
  { id: 'protecao', label: 'Proteção' },
  { id: 'controles', label: 'Seus controles' },
  { id: 'perfis', label: 'Perfis especiais' },
  { id: 'legal', label: 'Informações legais' },
];

export default function PrivacyPolicyPage() {
  const meta = DOCUMENT_META.privacy_policy;

  return (
    <LegalLayout
      title={LEGAL_CONFIG.privacyHeadline}
      subtitle={LEGAL_CONFIG.privacySubheadline}
      lastUpdated={meta.lastUpdated}
      version={DOCUMENT_VERSIONS.privacy_policy}
      sections={SECTIONS}
    >
      <LegalSectionBlock
        id="visao-geral"
        title="Visão geral"
        lead="A AirNext valoriza a privacidade e a proteção dos dados pessoais. Esta política explica como coletamos, utilizamos, armazenamos, protegemos e compartilhamos informações quando você usa nossos produtos e serviços."
      >
        <p>
          Ao utilizar os serviços da AirNext, você declara que leu e compreendeu esta Política de
          Privacidade. O controle sobre o que é público permanece, sempre que possível, nas suas
          mãos.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <LegalCard title="Controlador" icon={<FileText className="h-4 w-4" />}>
            <p>
              <strong className="text-zinc-800">{LEGAL_CONFIG.legalName}</strong>
              <br />
              Nome fantasia: {LEGAL_CONFIG.companyName}
              {LEGAL_CONFIG.cnpj ? (
                <>
                  <br />
                  CNPJ: {LEGAL_CONFIG.cnpj}
                </>
              ) : null}
              {LEGAL_CONFIG.address ? (
                <>
                  <br />
                  {LEGAL_CONFIG.address}
                </>
              ) : null}
            </p>
          </LegalCard>
          <LegalCard title="Contato de privacidade" icon={<Shield className="h-4 w-4" />}>
            <p>
              E-mail:{' '}
              <a
                className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
              >
                {LEGAL_CONFIG.privacyEmail}
              </a>
              {LEGAL_CONFIG.dataControllerName ? (
                <>
                  <br />
                  Responsável: {LEGAL_CONFIG.dataControllerName}
                </>
              ) : null}
            </p>
          </LegalCard>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="seus-dados"
        title="Seus dados"
        lead="A quantidade e o tipo de dados dependem de como você usa a AirNext e do que você escolhe adicionar ao perfil."
      >
        <LegalAccordion
          items={[
            {
              title: 'Dados de cadastro',
              content: (
                <ul className="list-disc space-y-1 pl-5">
                  <li>Nome</li>
                  <li>E-mail</li>
                  <li>Telefone (quando informado)</li>
                  <li>Senha ou credenciais de acesso</li>
                  <li>Data de nascimento, quando necessária</li>
                  <li>Identificadores da conta</li>
                </ul>
              ),
            },
            {
              title: 'Dados adicionados ao perfil',
              content: (
                <>
                  <p className="mb-2">
                    Você pode incluir foto, nome ou nome social, bio, contatos, redes, site,
                    informações profissionais, emergência e outros campos — conforme a categoria do
                    perfil. A AirNext não exige que todas as informações sejam preenchidas ou
                    tornadas públicas.
                  </p>
                  <p>Você é responsável por escolher o que inserir e o que fica visível.</p>
                </>
              ),
            },
            {
              title: 'Pets, Kids, Senior e TEA',
              content: (
                <p>
                  Perfis Pet, Kids, Senior e TEA podem incluir dados de identificação e contato do
                  responsável. Em Kids, Senior e TEA, o responsável deve avaliar com cuidado o que
                  será público. Dados de saúde ou sensíveis não devem ser expostos sem finalidade
                  legítima e adequada.
                </p>
              ),
            },
          ]}
        />
      </LegalSectionBlock>

      <LegalSectionBlock
        id="como-usamos"
        title="Como usamos seus dados"
        lead="Usamos informações para operar a plataforma de forma segura e alinhada ao que você espera."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              t: 'Conta e perfis',
              d: 'Criar contas, perfis digitais e permitir acesso via NFC e QR Code.',
            },
            {
              t: 'Personalização',
              d: 'Ajustar a experiência conforme suas preferências e configurações.',
            },
            { t: 'Pedidos e suporte', d: 'Processar pedidos, pagamentos e atendimento.' },
            {
              t: 'Segurança',
              d: 'Prevenir fraudes, abusos e proteger a integridade da plataforma.',
            },
            { t: 'Melhoria', d: 'Aprimorar produtos e serviços com base no uso agregado.' },
            {
              t: 'Obrigações legais',
              d: 'Cumprir leis e exercer direitos em processos quando necessário.',
            },
          ].map((item) => (
            <LegalCard key={item.t} title={item.t} icon={<Database className="h-4 w-4" />}>
              {item.d}
            </LegalCard>
          ))}
        </div>
        <p>
          A AirNext não utiliza dados pessoais para finalidades incompatíveis com as informadas a
          você.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="compartilhamento"
        title="Quando compartilhamos dados"
        lead="Não comercializamos seus dados pessoais como produto."
      >
        <p>
          Podemos compartilhar informações com prestadores que auxiliam na operação (hospedagem,
          armazenamento, pagamentos, e-mail, segurança e análise), apenas o necessário para suas
          funções. Também podemos compartilhar quando exigido por lei, ordem judicial, proteção de
          direitos, prevenção de fraudes ou segurança dos usuários.
        </p>
        <p>
          Alguns fornecedores podem processar dados fora do Brasil, observadas as exigências da
          legislação de proteção de dados. Buscamos parceiros com medidas adequadas de segurança.
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-700" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Perfis públicos e NFC / QR</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Informações que você marca como públicas podem ser acessadas por quem tiver o link,
                QR Code ou dispositivo NFC. O chip físico frequentemente apenas aponta para o perfil
                digital — não necessariamente armazena todos os seus dados. Recomendamos não
                publicar informações excessivamente sensíveis.
              </p>
            </div>
          </div>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="protecao"
        title="Como protegemos suas informações"
        lead="Adotamos medidas técnicas e organizacionais razoáveis — sem prometer segurança absoluta na internet."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              t: 'Acesso controlado',
              d: 'Autenticação e limitação de quem pode ver dados internos.',
            },
            { t: 'Infraestrutura', d: 'Monitoramento, backups e proteções de ambiente.' },
            {
              t: 'Criptografia',
              d: 'Uso de criptografia quando aplicável às comunicações e dados.',
            },
          ].map((item) => (
            <LegalCard key={item.t} title={item.t} icon={<Lock className="h-4 w-4" />}>
              {item.d}
            </LegalCard>
          ))}
        </div>
        <p>
          Mantemos dados pelo tempo necessário para prestar o serviço, cumprir obrigações legais,
          resolver disputas e prevenir fraudes. Depois, excluímos, anonimizamos ou conservamos
          apenas quando houver fundamento legal.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="controles"
        title="Você está no controle"
        lead="Seus direitos e caminhos para exercer controle sobre a conta e os dados."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              t: 'Ver seus dados',
              d: 'Solicite confirmação e acesso ao que tratamos sobre você.',
              icon: Eye,
            },
            {
              t: 'Corrigir informações',
              d: 'Atualize dados incompletos ou incorretos na conta ou pelo suporte.',
              icon: Settings2,
            },
            {
              t: 'Controlar o que é público',
              d: 'Ajuste visibilidade e campos do perfil no painel.',
              icon: Users,
            },
            {
              t: 'Revogar consentimentos',
              d: 'Retire consentimentos quando a lei permitir.',
              icon: Shield,
            },
            {
              t: 'Excluir sua conta',
              d: `Peça exclusão em ${LEGAL_CONFIG.privacyEmail}.`,
              icon: Lock,
            },
            {
              t: 'Portabilidade',
              d: 'Quando aplicável, solicite portabilidade dos seus dados.',
              icon: Share2,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <LegalCard key={item.t} title={item.t} icon={<Icon className="h-4 w-4" />}>
                {item.d}
              </LegalCard>
            );
          })}
        </div>
        <p>
          Solicitações:{' '}
          <a
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
            href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
          >
            {LEGAL_CONFIG.privacyEmail}
          </a>
          . Podemos pedir confirmação de identidade para proteger a segurança dos usuários.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="perfis"
        title="Perfis especiais"
        lead="Cada tipo de perfil pode ter necessidades diferentes de privacidade. O essencial: você ou o responsável escolhe o que compartilhar."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {PROFILE_TYPES.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">{p.name}</h3>
                {'sensitive' in p && p.sensitive && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Atenção
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-900">Kids, Senior e TEA</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
            <li>O usuário ou responsável escolhe as informações.</li>
            <li>Informações não precisam ser públicas por padrão.</li>
            <li>Dados sensíveis devem receber proteção adequada.</li>
            <li>O responsável decide com cuidado o que será compartilhado.</li>
          </ul>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="legal" title="Informações legais">
        <LegalAccordion
          items={[
            {
              title: 'Cookies e tecnologias semelhantes',
              content: (
                <p>
                  Usamos cookies para funcionamento, preferências, análise e segurança. Você pode
                  gerenciar preferências no banner de cookies ou no navegador. Detalhes em{' '}
                  <a
                    href="/politica-de-cookies"
                    className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                  >
                    Política de Cookies
                  </a>
                  .
                </p>
              ),
            },
            {
              title: 'Comunicações e marketing',
              content: (
                <p>
                  Enviamos comunicações necessárias à conta. Promoções dependem de consentimento ou
                  outra base legal. Você pode cancelar pelo link de descadastro ou pelos canais da
                  AirNext.
                </p>
              ),
            },
            {
              title: 'Responsabilidade pelo conteúdo do perfil',
              content: (
                <p>
                  Você é responsável pelas informações do perfil. Não insira dados falsos, conteúdo
                  ilegal, dados de terceiros sem autorização ou informações que coloquem alguém em
                  risco. Podemos remover ou limitar conteúdo que viole a lei, os Termos ou a
                  segurança.
                </p>
              ),
            },
            {
              title: 'Alterações desta política',
              content: (
                <p>
                  Podemos atualizar esta política por mudanças nos serviços, na lei ou em segurança.
                  Alterações relevantes podem ser comunicadas pelos canais disponíveis. A versão
                  vigente fica sempre nesta página.
                </p>
              ),
            },
            {
              title: 'Aceite',
              content: (
                <p>
                  Ao criar conta ou usar determinados serviços, podemos solicitar confirmação de
                  ciência da Política e dos Termos. Registramos a versão do documento, data e
                  horário do aceite para comprovação.
                </p>
              ),
            },
          ]}
        />
      </LegalSectionBlock>
    </LegalLayout>
  );
}
