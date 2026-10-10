import { Link } from 'react-router-dom';
import {
  LegalLayout,
  LegalSectionBlock,
  LegalAccordion,
  LegalCard,
} from '../components/legal/LegalLayout';
import { DOCUMENT_META, DOCUMENT_VERSIONS, LEGAL_CONFIG } from '../config/legal';

const SECTIONS = [
  { id: 'sobre', label: 'Sobre a AirNext' },
  { id: 'conta', label: 'Sua conta' },
  { id: 'perfis', label: 'Seus perfis' },
  { id: 'produtos', label: 'Produtos e serviços' },
  { id: 'uso', label: 'Uso aceitável' },
  { id: 'conteudo', label: 'Conteúdo do usuário' },
  { id: 'pagamentos', label: 'Compras e pagamentos' },
  { id: 'encerramento', label: 'Suspensão e encerramento' },
  { id: 'ip', label: 'Propriedade intelectual' },
  { id: 'limitacoes', label: 'Limitações' },
  { id: 'alteracoes', label: 'Alterações' },
];

export default function TermsOfUsePage() {
  const meta = DOCUMENT_META.terms_of_use;

  return (
    <LegalLayout
      title={LEGAL_CONFIG.termsHeadline}
      subtitle={LEGAL_CONFIG.termsSubheadline}
      lastUpdated={meta.lastUpdated}
      version={DOCUMENT_VERSIONS.terms_of_use}
      sections={SECTIONS}
    >
      <LegalSectionBlock
        id="sobre"
        title="Sobre a AirNext"
        lead="A AirNext é uma plataforma de identidade digital que conecta o físico ao digital por meio de cartões, tags, NFC, QR Codes e perfis."
      >
        <p>
          Estes Termos regem o uso dos sites, aplicativos, painéis e produtos físicos associados à
          marca {LEGAL_CONFIG.companyName}. Ao criar uma conta ou usar os serviços, você concorda
          com estes Termos e com a{' '}
          <Link
            to="/politica-de-privacidade"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <p>
          Operado por <strong className="text-zinc-800">{LEGAL_CONFIG.legalName}</strong>
          {LEGAL_CONFIG.cnpj ? ` (CNPJ ${LEGAL_CONFIG.cnpj})` : ''}. Contato:{' '}
          <a
            href={`mailto:${LEGAL_CONFIG.supportEmail}`}
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            {LEGAL_CONFIG.supportEmail}
          </a>
          .
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="conta" title="Sua conta">
        <LegalAccordion
          items={[
            {
              title: 'Cadastro e segurança',
              content: (
                <p>
                  Você deve fornecer informações verdadeiras e manter a confidencialidade das
                  credenciais. Atividades realizadas na conta são de sua responsabilidade. Avise-nos
                  imediatamente em caso de uso não autorizado.
                </p>
              ),
            },
            {
              title: 'Idade e responsáveis',
              content: (
                <p>
                  Contas e perfis de menores devem ser criados e administrados por pais ou
                  responsáveis legais. O responsável declara ter autorização para gerir o perfil.
                </p>
              ),
            },
            {
              title: 'Uma conta, vários produtos',
              content: (
                <p>
                  Uma conta pode estar associada a um ou mais produtos AirNext (cartões, tags etc.),
                  conforme o que você ativar e as regras comerciais vigentes.
                </p>
              ),
            },
          ]}
        />
      </LegalSectionBlock>

      <LegalSectionBlock
        id="perfis"
        title="Seus perfis"
        lead="Você controla o conteúdo e, quando disponível, a visibilidade do perfil."
      >
        <p>
          Perfis podem ser pessoais, empresariais, pet, kids, senior ou TEA. Informações públicas
          podem ser acessadas por quem tiver o link, QR ou NFC. Não publique dados excessivamente
          sensíveis. Em perfis Kids, Senior e TEA, o responsável deve decidir com cuidado o que
          compartilhar.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="produtos" title="Produtos e serviços">
        <p>
          Produtos físicos e digitais podem ser ativados com códigos fornecidos pela AirNext. O
          dispositivo NFC/QR frequentemente funciona como acesso ao perfil online, não como banco
          completo de dados. Podemos atualizar software, URLs e funcionalidades para melhorar o
          serviço.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="uso" title="Uso aceitável">
        <div className="grid gap-3 sm:grid-cols-2">
          <LegalCard title="Permitido">
            Usar a plataforma para identidade digital legítima, networking, identificação de pets e
            comunicação assistida dentro da lei e destes Termos.
          </LegalCard>
          <LegalCard title="Não permitido">
            Fraude, spam, engenharia reversa abusiva, violação de direitos de terceiros, conteúdo
            ilegal, assédio, ou uso que comprometa a segurança da plataforma ou de outras pessoas.
          </LegalCard>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="conteudo" title="Conteúdo do usuário">
        <p>
          Você mantém a titularidade do conteúdo que envia, mas concede à AirNext licença para
          hospedar, exibir e processar esse conteúdo na medida necessária para prestar o serviço.
          Você garante que tem direitos sobre o que publica e que não viola a lei ou direitos de
          terceiros.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="pagamentos" title="Compras e pagamentos">
        <p>
          Valores, planos e condições de renovação serão informados no momento da compra ou no
          painel. Pagamentos podem ser processados por parceiros. Reembolsos seguem a política
          comercial e a legislação aplicável (incluindo CDC, quando couber).
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="encerramento" title="Suspensão e encerramento">
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos, a lei ou a segurança dos
          usuários. Você pode solicitar exclusão da conta pelos canais oficiais. Algumas informações
          podem ser retidas quando a lei exigir.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="ip" title="Propriedade intelectual">
        <p>
          Marcas, interfaces, software e materiais da AirNext são protegidos. Estes Termos não
          transferem propriedade intelectual a você, apenas o direito de uso conforme permitido.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="limitacoes" title="Limitações de responsabilidade">
        <p>
          Na máxima extensão permitida pela lei, a AirNext não se responsabiliza por danos indiretos,
          lucros cessantes ou perdas decorrentes de uso indevido do perfil, indisponibilidade
          temporária, ou conteúdo publicado por usuários. Nada nestes Termos limita direitos
          inegociáveis do consumidor.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="alteracoes" title="Alterações dos termos">
        <p>
          Podemos atualizar estes Termos. A versão vigente estará nesta página, com data e número de
          versão. Alterações relevantes podem exigir novo aceite. O uso continuado após a vigência
          das mudanças, quando permitido, constitui concordância, ressalvados direitos legais.
        </p>
        <p className="text-sm text-zinc-400">
          Versão {DOCUMENT_VERSIONS.terms_of_use} · {meta.lastUpdated}
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}
