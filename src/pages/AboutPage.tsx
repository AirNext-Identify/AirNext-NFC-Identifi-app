import { Link } from 'react-router-dom';
import { LegalLayout, LegalSectionBlock, LegalCard } from '../components/legal/LegalLayout';
import { AIRNEXT_DEFINITION, AIRNEXT_HOW_IT_WORKS } from '../config/aiContent';
import { CATALOG_PRODUCTS, formatBRL } from '../config/catalog';
import { LEGAL_CONFIG } from '../config/legal';

const SECTIONS = [
  { id: 'o-que-e', label: 'O que é a AirNext' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'privacidade', label: 'Privacidade e controle' },
  { id: 'empresa', label: 'A empresa' },
];

const linkCls = 'font-medium text-zinc-900 underline-offset-2 hover:underline';

export default function AboutPage() {
  return (
    <LegalLayout
      title="Sobre a AirNext"
      subtitle="Cartões, tags e pulseiras NFC que abrem um perfil digital com um toque, sem aplicativo."
      lastUpdated="30/10/2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="o-que-e" title="O que é a AirNext" lead={AIRNEXT_DEFINITION}>
        <p>
          Todo produto tem também um QR Code de reserva, para celulares sem NFC. O perfil é editado em um painel online;
          o produto físico continua o mesmo, então você muda contatos, links e fotos sem trocar nada na mão de quem usa.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="como-funciona" title="Como funciona">
        <ol className="list-decimal space-y-2 pl-5">
          {AIRNEXT_HOW_IT_WORKS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="produtos"
        title="Produtos"
        lead="Uma linha para cada uso: pessoas, negócios, pets, crianças, idosos e eventos."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {CATALOG_PRODUCTS.map((p) => (
            <LegalCard key={p.id} title={p.name}>
              <p>{p.desc}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {p.tag} · {formatBRL(p.price)} ·{' '}
                <Link to={`/produto/${p.id}`} className={linkCls}>
                  Ver produto
                </Link>
              </p>
            </LegalCard>
          ))}
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock
        id="privacidade"
        title="Privacidade e controle"
        lead="Você escolhe o que aparece no perfil, para quem e por quanto tempo."
      >
        <p>
          Tratamos dados pessoais conforme a LGPD. Leia a{' '}
          <Link to="/politica-de-privacidade" className={linkCls}>Política de Privacidade</Link>, os{' '}
          <Link to="/termos-de-uso" className={linkCls}>Termos de Uso</Link> e a{' '}
          <Link to="/politica-de-cookies" className={linkCls}>Política de Cookies</Link>.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="empresa" title="A empresa">
        <p>
          {LEGAL_CONFIG.legalName}, operando como {LEGAL_CONFIG.companyName}. {LEGAL_CONFIG.tagline}
          {LEGAL_CONFIG.cnpj ? ` CNPJ ${LEGAL_CONFIG.cnpj}.` : ''}
          {LEGAL_CONFIG.address ? ` ${LEGAL_CONFIG.address}.` : ''}
        </p>
        <p>
          Dúvidas ou parcerias? Veja a página de{' '}
          <Link to="/contato" className={linkCls}>Contato</Link>.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}
