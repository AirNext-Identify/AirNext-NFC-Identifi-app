import { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, MapPin, QrCode, User, Check } from 'lucide-react';
import type { PaymentMethod, ShippingAddress } from '../../lib/orders';

export interface CheckoutInfo {
  nome: string;
  telefone: string;
  email: string;
  recebeOutro: boolean;      // false = o próprio comprador recebe
  recebedorNome: string;
  recebedorTelefone: string;
  cep: string;
  rua: string;
  numero: string;
  semNumero: boolean;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string;
  pagamento: PaymentMethod | '';
  obs: string;
}

export const EMPTY_CHECKOUT: CheckoutInfo = {
  nome: '', telefone: '', email: '',
  recebeOutro: false, recebedorNome: '', recebedorTelefone: '',
  cep: '', rua: '', numero: '', semNumero: false, complemento: '', bairro: '', cidade: '', uf: '', referencia: '',
  pagamento: '', obs: '',
};

const digits = (v: string) => v.replace(/\D/g, '');

export const maskPhone = (v: string) => {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
export const maskCep = (v: string) => {
  const d = digits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export type CheckoutErrors = Partial<Record<keyof CheckoutInfo, string>>;

export function validateCheckout(c: CheckoutInfo): CheckoutErrors {
  const e: CheckoutErrors = {};
  if (c.nome.trim().length < 3) e.nome = 'Informe seu nome completo.';
  if (![10, 11].includes(digits(c.telefone).length)) e.telefone = 'Informe um telefone com DDD.';
  if (c.email.trim() && !/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = 'E-mail inválido.';
  if (c.recebeOutro) {
    if (c.recebedorNome.trim().length < 3) e.recebedorNome = 'Informe o nome de quem vai receber.';
    if (c.recebedorTelefone && ![10, 11].includes(digits(c.recebedorTelefone).length)) e.recebedorTelefone = 'Telefone inválido.';
  }
  if (digits(c.cep).length !== 8) e.cep = 'CEP com 8 dígitos.';
  if (!c.rua.trim()) e.rua = 'Informe a rua.';
  if (!c.semNumero && !c.numero.trim()) e.numero = 'Informe o número ou marque "sem número".';
  if (!c.bairro.trim()) e.bairro = 'Informe o bairro.';
  if (!c.cidade.trim()) e.cidade = 'Informe a cidade.';
  if (!/^[A-Za-z]{2}$/.test(c.uf.trim())) e.uf = 'UF com 2 letras.';
  if (!c.pagamento) e.pagamento = 'Escolha a forma de pagamento.';
  return e;
}

export function toShippingAddress(c: CheckoutInfo): ShippingAddress {
  return {
    cep: maskCep(c.cep),
    street: c.rua.trim(),
    number: c.semNumero ? 's/n' : c.numero.trim(),
    complement: c.complemento.trim() || undefined,
    neighborhood: c.bairro.trim(),
    city: c.cidade.trim(),
    state: c.uf.trim().toUpperCase(),
    reference: c.referencia.trim() || undefined,
  };
}

function Field({ id, label, error, hint, muted, children, className = '' }: {
  id: string; label: string; error?: string; hint?: string; muted: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[11px] font-semibold mb-1">{label}</label>
      {children}
      {error ? <p role="alert" className="text-[11px] text-red-500 mt-1">{error}</p>
        : hint ? <p className={`text-[11px] mt-1 ${muted}`}>{hint}</p> : null}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#0071e3] mb-3">{icon}{children}</h4>;
}

interface Props {
  isDark: boolean;
  value: CheckoutInfo;
  onChange: (next: CheckoutInfo) => void;
  /** Mostra os erros de todos os campos (após tentar enviar). */
  showErrors: boolean;
}

export default function CheckoutForm({ isDark, value: v, onChange, showErrors }: Props) {
  const set = <K extends keyof CheckoutInfo>(k: K, val: CheckoutInfo[K]) => onChange({ ...v, [k]: val });
  const errors = validateCheckout(v);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cepState, setCepState] = useState<'idle' | 'loading' | 'ok' | 'notfound'>('idle');
  const lastCep = useRef('');
  const numberRef = useRef<HTMLInputElement>(null);
  const latest = useRef(v);
  latest.current = v;

  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));
  const err = (k: keyof CheckoutInfo) => (showErrors || touched[k]) ? errors[k] : undefined;

  // Preenche rua/bairro/cidade/UF automaticamente quando o CEP está completo (ViaCEP).
  useEffect(() => {
    const d = digits(v.cep);
    if (d.length !== 8) { setCepState('idle'); return; }
    if (lastCep.current === d) return;
    lastCep.current = d;
    const ctrl = new AbortController();
    setCepState('loading');
    fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (data?.erro) { setCepState('notfound'); return; }
        const cur = latest.current;
        onChange({
          ...cur,
          rua: data.logradouro || cur.rua,
          bairro: data.bairro || cur.bairro,
          cidade: data.localidade || cur.cidade,
          uf: data.uf || cur.uf,
        });
        setCepState('ok');
        window.setTimeout(() => numberRef.current?.focus(), 50);
      })
      .catch(e => { if (e?.name !== 'AbortError') setCepState('notfound'); }); // sem internet/bloqueio: preenche à mão
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.cep]);

  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const card = isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100';
  const inputBase = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
    isDark ? 'bg-[#050505] text-white placeholder:text-gray-600' : 'bg-white placeholder:text-gray-400'}`;
  const inputCls = (k: keyof CheckoutInfo) =>
    `${inputBase} ${err(k) ? 'border-red-500/70' : isDark ? 'border-white/10' : 'border-gray-200'}`;

  const payOption = (id: PaymentMethod, title: string, desc: string, icon: React.ReactNode) => {
    const active = v.pagamento === id;
    return (
      <button
        type="button" role="radio" aria-checked={active}
        onClick={() => set('pagamento', id)}
        className={`relative text-left rounded-2xl border p-3.5 transition flex flex-col gap-1.5 ${
          active ? 'border-[#0071e3] ring-2 ring-[#0071e3]/25 ' + (isDark ? 'bg-[#0071e3]/10' : 'bg-blue-50')
                 : (isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}`}
      >
        {active && <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center"><Check size={12} /></span>}
        <span className={active ? 'text-[#0071e3]' : muted}>{icon}</span>
        <span className="text-sm font-bold">{title}</span>
        <span className={`text-[11px] leading-snug ${muted}`}>{desc}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Contato */}
      <section className={`rounded-2xl border p-4 ${card}`}>
        <SectionTitle icon={<User size={14} />}>Seus dados</SectionTitle>
        <div className="space-y-3">
          <Field id="co-nome" label="Nome completo *" error={err('nome')} muted={muted}>
            <input id="co-nome" type="text" autoComplete="name" value={v.nome} className={inputCls('nome')}
              onChange={e => set('nome', e.target.value)} onBlur={() => touch('nome')} />
          </Field>
          <Field id="co-tel" label="WhatsApp / telefone *" error={err('telefone')} muted={muted}>
            <input id="co-tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={v.telefone}
              className={inputCls('telefone')} onChange={e => set('telefone', maskPhone(e.target.value))} onBlur={() => touch('telefone')} />
          </Field>
          <Field id="co-email" label="E-mail (opcional)" error={err('email')} muted={muted} hint="Para receber a confirmação do pedido.">
            <input id="co-email" type="email" autoComplete="email" value={v.email} className={inputCls('email')}
              onChange={e => set('email', e.target.value)} onBlur={() => touch('email')} />
          </Field>
        </div>
      </section>

      {/* 2. Entrega */}
      <section className={`rounded-2xl border p-4 ${card}`}>
        <SectionTitle icon={<MapPin size={14} />}>Entrega</SectionTitle>
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer select-none">
            <input type="checkbox" checked={v.recebeOutro} onChange={e => set('recebeOutro', e.target.checked)}
              className="w-4 h-4 accent-[#0071e3]" />
            Outra pessoa vai receber o pedido
          </label>
          {v.recebeOutro && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field id="co-rnome" label="Nome de quem vai receber *" error={err('recebedorNome')} muted={muted}>
                <input id="co-rnome" type="text" value={v.recebedorNome} className={inputCls('recebedorNome')}
                  onChange={e => set('recebedorNome', e.target.value)} onBlur={() => touch('recebedorNome')} />
              </Field>
              <Field id="co-rtel" label="Telefone de quem recebe" error={err('recebedorTelefone')} muted={muted}>
                <input id="co-rtel" type="tel" inputMode="tel" placeholder="(00) 00000-0000" value={v.recebedorTelefone}
                  className={inputCls('recebedorTelefone')} onChange={e => set('recebedorTelefone', maskPhone(e.target.value))} onBlur={() => touch('recebedorTelefone')} />
              </Field>
            </div>
          )}

          <Field id="co-cep" label="CEP *" error={err('cep')} muted={muted}
            hint={cepState === 'notfound' ? 'Não encontramos esse CEP — preencha o endereço manualmente.' : cepState === 'ok' ? 'Endereço preenchido pelo CEP. Confira os dados.' : undefined}>
            <div className="relative">
              <input id="co-cep" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={v.cep}
                className={inputCls('cep')} onChange={e => set('cep', maskCep(e.target.value))} onBlur={() => touch('cep')} />
              {cepState === 'loading' && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
            </div>
          </Field>
          <Field id="co-rua" label="Rua / Avenida *" error={err('rua')} muted={muted}>
            <input id="co-rua" type="text" autoComplete="address-line1" value={v.rua} className={inputCls('rua')}
              onChange={e => set('rua', e.target.value)} onBlur={() => touch('rua')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="co-num" label="Número *" error={err('numero')} muted={muted}>
              <input id="co-num" ref={numberRef} type="text" inputMode="numeric" disabled={v.semNumero}
                value={v.semNumero ? 's/n' : v.numero} className={`${inputCls('numero')} disabled:opacity-60`}
                onChange={e => set('numero', e.target.value)} onBlur={() => touch('numero')} />
            </Field>
            <Field id="co-comp" label="Complemento" error={err('complemento')} muted={muted}>
              <input id="co-comp" type="text" placeholder="Apto, bloco, sala…" value={v.complemento} className={inputCls('complemento')}
                onChange={e => set('complemento', e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none -mt-1">
            <input type="checkbox" checked={v.semNumero} onChange={e => onChange({ ...v, semNumero: e.target.checked, numero: '' })}
              className="w-3.5 h-3.5 accent-[#0071e3]" />
            Endereço sem número
          </label>
          <Field id="co-bairro" label="Bairro *" error={err('bairro')} muted={muted}>
            <input id="co-bairro" type="text" value={v.bairro} className={inputCls('bairro')}
              onChange={e => set('bairro', e.target.value)} onBlur={() => touch('bairro')} />
          </Field>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <Field id="co-cidade" label="Cidade *" error={err('cidade')} muted={muted}>
              <input id="co-cidade" type="text" autoComplete="address-level2" value={v.cidade} className={inputCls('cidade')}
                onChange={e => set('cidade', e.target.value)} onBlur={() => touch('cidade')} />
            </Field>
            <Field id="co-uf" label="UF *" error={err('uf')} muted={muted}>
              <input id="co-uf" type="text" maxLength={2} autoComplete="address-level1" value={v.uf}
                className={`${inputCls('uf')} uppercase`} onChange={e => set('uf', e.target.value.replace(/[^a-zA-Z]/g, ''))} onBlur={() => touch('uf')} />
            </Field>
          </div>
          <Field id="co-ref" label="Ponto de referência" error={err('referencia')} muted={muted}>
            <input id="co-ref" type="text" placeholder="Ex.: portão azul, próximo à padaria" value={v.referencia} className={inputCls('referencia')}
              onChange={e => set('referencia', e.target.value)} />
          </Field>
          <p className={`text-[11px] leading-relaxed ${muted}`}>
            O valor do frete e o prazo de entrega são confirmados pela nossa equipe no WhatsApp.
          </p>
        </div>
      </section>

      {/* 3. Pagamento */}
      <section className={`rounded-2xl border p-4 ${card}`}>
        <SectionTitle icon={<CreditCard size={14} />}>Forma de pagamento</SectionTitle>
        <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-3">
          {payOption('pix', 'Pix', 'Enviamos o QR Code / chave Pix pelo WhatsApp.', <QrCode size={20} />)}
          {payOption('cartao', 'Cartão', 'Enviamos um link seguro de pagamento pelo WhatsApp.', <CreditCard size={20} />)}
        </div>
        {err('pagamento') && <p role="alert" className="text-[11px] text-red-500 mt-2">{err('pagamento')}</p>}
        <p className={`text-[11px] leading-relaxed mt-3 ${muted}`}>
          Você não paga nem digita dados de cartão aqui: o pagamento é combinado com segurança na conversa.
        </p>
      </section>

      {/* 4. Observações */}
      <section>
        <label htmlFor="co-obs" className="block text-[11px] font-semibold mb-1">Observações (opcional)</label>
        <textarea id="co-obs" rows={2} value={v.obs} onChange={e => set('obs', e.target.value)}
          placeholder="Algo que a gente precise saber? Ex.: nome para personalização, horário de entrega…"
          className={`${inputBase} resize-none ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
      </section>
    </div>
  );
}
