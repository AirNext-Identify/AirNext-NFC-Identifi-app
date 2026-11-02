import { Link } from 'react-router-dom';
import { AtSign, Camera, LifeBuoy, MessageCircle, ShieldCheck } from 'lucide-react';
import { LegalLayout, LegalSectionBlock, LegalCard } from '../components/legal/LegalLayout';
import { LEGAL_CONFIG } from '../config/legal';

const SECTIONS = [
  { id: 'canais', label: 'Canais de atendimento' },
  { id: 'suporte', label: 'Suporte técnico' },
  { id: 'dados', label: 'Dados pessoais (LGPD)' },
  { id: 'empresa', label: 'Dados da empresa' },
];

const linkCls = 'font-medium text-zinc-900 underline-offset-2 hover:underline';
const wa = (text: string) => `https://wa.me/${LEGAL_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;

export default function ContactPage() {
  return (
    <LegalLayout
      title="Fale com a AirNext"
      subtitle="Vendas, suporte e dúvidas sobre privacidade, direto com a nossa equipe."
      lastUpdated="30/10/2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="canais" title="Canais de atendimento" lead="Escolha o canal que for mais rápido para você.">
        <div className="grid gap-3 sm:grid-cols-2">
          <LegalCard title="WhatsApp" icon={<MessageCircle size={18} />}>
            <a href={wa('Olá! Quero saber mais sobre a AirNext.')} target="_blank" rel="noopener noreferrer" className={linkCls}>
              {LEGAL_CONFIG.phone}
            </a>
          </LegalCard>
          <LegalCard title="E-mail" icon={<AtSign size={18} />}>
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className={linkCls}>
              {LEGAL_CONFIG.supportEmail}
            </a>
          </LegalCard>
          <LegalCard title="Telefone" icon={<LifeBuoy size={18} />}>
            <a href={`tel:${LEGAL_CONFIG.phoneE164}`} className={linkCls}>
              {LEGAL_CONFIG.phone}
            </a>
          </LegalCard>
          <LegalCard title="Instagram" icon={<Camera size={18} />}>
            <a href={LEGAL_CONFIG.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
              @airnext.com.br
            </a>
          </LegalCard>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="suporte" title="Suporte técnico" lead="Precisa ativar ou usar seu produto?">
        <p>
          Veja os tutoriais em{' '}
          <Link to="/suporte" className={linkCls}>Suporte e tutoriais</Link>. Se não resolver, chame no{' '}
          <a href={wa('Olá! Preciso de ajuda com meu produto AirNext.')} target="_blank" rel="noopener noreferrer" className={linkCls}>
            WhatsApp
          </a>.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="dados" title="Dados pessoais (LGPD)" lead="Pedidos de acesso, correção ou exclusão de dados.">
        <LegalCard title="Privacidade" icon={<ShieldCheck size={18} />}>
          <a href={`mailto:${LEGAL_CONFIG.privacyEmail}`} className={linkCls}>{LEGAL_CONFIG.privacyEmail}</a>
          <p className="mt-2 text-sm text-zinc-500">
            Detalhes na <Link to="/politica-de-privacidade" className={linkCls}>Política de Privacidade</Link>.
          </p>
        </LegalCard>
      </LegalSectionBlock>

      <LegalSectionBlock id="empresa" title="Dados da empresa">
        <p>
          {LEGAL_CONFIG.legalName}
          {LEGAL_CONFIG.cnpj ? ` · CNPJ ${LEGAL_CONFIG.cnpj}` : ''}
          {LEGAL_CONFIG.address ? ` · ${LEGAL_CONFIG.address}` : ''}
        </p>
        <p>
          Conheça a empresa em <Link to="/sobre" className={linkCls}>Sobre a AirNext</Link> e leia os{' '}
          <Link to="/termos-de-uso" className={linkCls}>Termos de Uso</Link>.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}
