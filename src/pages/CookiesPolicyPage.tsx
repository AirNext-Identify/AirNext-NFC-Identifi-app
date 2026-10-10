import { Link } from 'react-router-dom';
import {
  LegalLayout,
  LegalSectionBlock,
  LegalCard,
  LegalAccordion,
} from '../components/legal/LegalLayout';
import { DOCUMENT_META, DOCUMENT_VERSIONS, LEGAL_CONFIG } from '../config/legal';

const SECTIONS = [
  { id: 'o-que-sao', label: 'O que são cookies' },
  { id: 'como-usamos', label: 'Como usamos' },
  { id: 'tipos', label: 'Tipos' },
  { id: 'gestao', label: 'Como gerenciar' },
  { id: 'atualizacoes', label: 'Atualizações' },
];

export default function CookiesPolicyPage() {
  const meta = DOCUMENT_META.cookies_policy;

  return (
    <LegalLayout
      title={LEGAL_CONFIG.cookiesHeadline}
      subtitle={LEGAL_CONFIG.cookiesSubheadline}
      lastUpdated={meta.lastUpdated}
      version={DOCUMENT_VERSIONS.cookies_policy}
      sections={SECTIONS}
    >
      <LegalSectionBlock
        id="o-que-sao"
        title="O que são cookies"
        lead="Cookies são pequenos arquivos armazenados no seu dispositivo para lembrar preferências, manter sessões e entender o uso do site."
      >
        <p>
          Também podemos usar tecnologias semelhantes (local storage, pixels). Esta política
          complementa a{' '}
          <Link
            to="/politica-de-privacidade"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="como-usamos" title="Como usamos">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              t: 'Essenciais',
              d: 'Login, segurança, preferências básicas e funcionamento do site.',
            },
            { t: 'Preferências', d: 'Lembrar idioma, tema ou escolhas de cookies.' },
            {
              t: 'Analíticos',
              d: 'Entender uso agregado para melhorar a experiência (quando autorizado).',
            },
            { t: 'Marketing', d: 'Somente com consentimento, quando aplicável.' },
          ].map((c) => (
            <LegalCard key={c.t} title={c.t}>
              {c.d}
            </LegalCard>
          ))}
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="tipos" title="Tipos">
        <LegalAccordion
          items={[
            {
              title: 'Cookies estritamente necessários',
              content: (
                <p>
                  Indispensáveis para autenticação, proteção contra abuso e recursos centrais. Sem
                  eles, partes do serviço podem não funcionar.
                </p>
              ),
            },
            {
              title: 'Cookies de desempenho e análise',
              content: (
                <p>
                  Ajudam a medir visitas e interações de forma agregada. Ativados conforme suas
                  preferências no banner de cookies da landing.
                </p>
              ),
            },
            {
              title: 'Armazenamento local',
              content: (
                <p>
                  Preferências de interface, consentimentos e dados de sessão podem ficar no
                  navegador (localStorage) para melhorar a experiência.
                </p>
              ),
            },
          ]}
        />
      </LegalSectionBlock>

      <LegalSectionBlock id="gestao" title="Como gerenciar">
        <p>
          No site institucional, use o banner ou “Configurações de Cookies” no rodapé. No navegador,
          você pode bloquear ou apagar cookies nas configurações de privacidade. Bloquear cookies
          essenciais pode impedir login ou funções críticas.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="atualizacoes" title="Atualizações">
        <p>
          Podemos revisar esta política. A versão atual é {DOCUMENT_VERSIONS.cookies_policy},
          atualizada em {meta.lastUpdated}. Dúvidas:{' '}
          <a
            href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
          >
            {LEGAL_CONFIG.privacyEmail}
          </a>
          .
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}
