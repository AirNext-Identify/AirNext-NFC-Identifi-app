import { useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, Category, ProfileTheme } from '../contexts/AuthContext';
import { Zap, CheckCircle, Loader2, UserCheck, Briefcase, PawPrint, Baby, Heart, Brain, ChevronLeft, Camera, Phone, Share2, Palette, PartyPopper, ArrowRight, X } from 'lucide-react';
import Logo from '../components/Logo';

const CATS:{id:Category;label:string;desc:string;icon:React.ElementType;color:string}[]=[
  {id:'PERSONAL',label:'Pessoa',desc:'Compartilhamento pessoal',icon:UserCheck,color:'from-blue-500 to-cyan-400'},
  {id:'BUSINESS',label:'Negócio',desc:'Networking e empresas',icon:Briefcase,color:'from-amber-500 to-orange-400'},
  {id:'PET',label:'Pet',desc:'Identificação inteligente',icon:PawPrint,color:'from-emerald-500 to-green-400'},
  {id:'KIDS',label:'Kids',desc:'Segurança infantil',icon:Baby,color:'from-pink-500 to-rose-400'},
  {id:'SENIOR',label:'Senior',desc:'Emergência e saúde',icon:Heart,color:'from-red-500 to-orange-400'},
  {id:'TEA',label:'TEA',desc:'Perfil especializado autismo',icon:Brain,color:'from-violet-500 to-purple-400'},
];

const THEMES:{id:ProfileTheme;label:string;bg:string}[]=[
  {id:'claro',label:'Claro',bg:'bg-zinc-200'},{id:'escuro',label:'Escuro',bg:'bg-zinc-800'},
  {id:'moderno',label:'Premium',bg:'bg-gradient-to-r from-indigo-500 to-purple-500'},
  {id:'minimalista',label:'Minimal',bg:'bg-white border border-zinc-300'},
  {id:'empresarial',label:'Business',bg:'bg-slate-900'},
];

// Field definitions per category for each wizard step
const STEP2:Record<string,string[][]>={
  PERSONAL:[['whatsapp','WhatsApp'],['telefone','Telefone'],['email','E-mail']],
  BUSINESS:[['whatsapp','WhatsApp Comercial'],['telefone','Telefone'],['email','E-mail']],
  PET:[['whatsappTutor','WhatsApp do Tutor'],['contatoEmergencia','Contato Emergência']],
  KIDS:[['telefoneResp1','Telefone Responsável 1'],['telefoneResp2','Telefone Responsável 2'],['contatoEmergencia','Contato Emergência']],
  SENIOR:[['telefoneEmerg1','Telefone Emergência 1'],['telefoneEmerg2','Telefone Emergência 2']],
  TEA:[['telefoneResponsavel','Telefone Responsável'],['telefoneEmergencia','Telefone Emergência']],
};
const STEP3:Record<string,string[][]>={
  PERSONAL:[['instagram','Instagram'],['linkedin','LinkedIn'],['facebook','Facebook'],['tiktok','TikTok'],['site','Website']],
  BUSINESS:[['instagram','Instagram'],['facebook','Facebook'],['linkedin','LinkedIn'],['site','Website'],['catalogo','Link Catálogo']],
  PET:[['veterinario','Veterinário'],['vacinas','Vacinas'],['alergias','Alergias'],['medicamentos','Medicamentos']],
  KIDS:[['responsavel1','Responsável 1'],['responsavel2','Responsável 2'],['escola','Escola'],['alergias','Alergias'],['tipoSanguineo','Tipo Sanguíneo']],
  SENIOR:[['contatoEmergencia1','Contato Emergência 1'],['contatoEmergencia2','Contato Emergência 2'],['medicacoes','Medicações'],['medicoResponsavel','Médico'],['tipoSanguineo','Tipo Sanguíneo'],['planoSaude','Plano de Saúde']],
  TEA:[['responsavel','Responsável'],['preferenciaComunicacao','Comunicação Ideal'],['sensibilidades','Sensibilidades'],['comoAjudar','Como me ajudar']],
};

export default function ActivationPage() {
  const { code: paramCode } = useParams<{code:string}>();
  const { activateProduct, setupProfile, user } = useAuth();
  const nav = useNavigate();

  // Formata o código automaticamente enquanto o usuário digita, sem que ele
  // precise apertar "-": "AIR7F3K9QZP" vira "AIR-7F3K9QZP" sozinho.
  // Formato oficial em TODO o sistema: "AIR-" + 8 caracteres, um único
  // traço, 12 caracteres no total (ver src/lib/adminUtils.ts generateActivationCode).
  const formatActivationCode = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.slice(0, 3);
    const rest = clean.slice(3, 11);
    return rest ? `${prefix}-${rest}` : prefix;
  };

  // Main flow: code → category → step1 → step2 → step3 → theme → done
  const [phase, setPhase] = useState<'code'|'category'|'wizard'|'done'>('code');
  const [wizStep, setWizStep] = useState(1); // 1-5
  const [code, setCode] = useState(formatActivationCode(paramCode || ''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activated, setActivated] = useState<{id:string}|null>(null);
  const [category, setCategory] = useState<Category>('PERSONAL');
  const [slug, setSlug] = useState('');
  const [theme, setTheme] = useState<ProfileTheme>('moderno');
  const [form, setForm] = useState<Record<string,any>>({nome: user?.name || ''});
  const set = (k:string,v:any) => setForm(p=>({...p,[k]:v}));

  const inp = "w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 text-sm transition-all";
  const inpStyle: React.CSSProperties = { color: '#ffffff' };

const handleActivate = async () => {
  setBusy(true);
  setError('');

  const res = await activateProduct(code);

  console.log('RESPOSTA:', res);

  if (!res || !res.product?.id) {
    setBusy(false);
    setError('Falha ao ativar produto.');
    return;
  }

  setActivated({ id: res.product.id });
  setPhase('category');
  setBusy(false);

};

const handleFinish = async () => {
if (!activated || !user) return;

setBusy(true);
setError('');

const finalSlug =
slug.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() ||
Math.random().toString(36).substring(2, 8);

// products é a fonte oficial usada pelo Dashboard/Editor/Analytics/páginas
// públicas, então a categoria, dados do perfil, slug e tema deste produto
// recém ativado precisam ser gravados ali (nunca apenas em profiles).
const { ok, error } = await setupProfile({
  product_id: activated.id,
  category,
  profile_data: form,
  slug: finalSlug,
  theme,
  visibility: 'public',
});

setBusy(false);

if (!ok) {
console.error(error);
setError(typeof error === 'string' ? error : error?.message || 'Falha ao salvar perfil.');
return;
}

setSlug(finalSlug);
setPhase('done');
};

  // Step labels for wizard
  const wizLabels = ['Identidade','Contato','Detalhes','Tema','Finalizar'];
  const wizIcons = [Camera, Phone, Share2, Palette, CheckCircle];

  // The description fields for step 1 by category
  const nameField = category === 'BUSINESS' ? 'nomeEmpresa' : 'nome';
  const namePh = category === 'BUSINESS' ? 'Nome da empresa' : category === 'PET' ? 'Nome do pet' : category === 'KIDS' ? 'Nome da criança' : 'Nome completo';
  const descField = category === 'BUSINESS' ? 'descricao' : category === 'PET' ? 'raca' : category === 'KIDS' ? 'escola' : category === 'SENIOR' ? 'planoSaude' : category === 'TEA' ? 'preferenciaComunicacao' : 'cargo';
  const descPh = category === 'BUSINESS' ? 'Descrição da empresa' : category === 'PET' ? 'Raça' : category === 'KIDS' ? 'Escola' : category === 'SENIOR' ? 'Plano de Saúde' : category === 'TEA' ? 'Como se comunica' : 'Cargo / Profissão';
  const bioField = category === 'BUSINESS' ? 'endereco' : 'bio';
  const bioPh = category === 'BUSINESS' ? 'Endereço' : category === 'PET' ? 'Idade e observações' : category === 'KIDS' ? 'Observações' : category === 'SENIOR' ? 'Observações' : category === 'TEA' ? 'Informações importantes' : 'Bio / Sobre você';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 pt-24 pb-8 relative overflow-hidden">
      {/* Discreet Apple-style back button */}
      <button onClick={() => nav('/dashboard')} className="fixed top-5 left-5 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-full glass text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all text-xs font-medium">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>
      {/* Cancel option top-right */}
      <button onClick={() => nav('/dashboard')} className="fixed top-5 right-5 z-50 p-2 rounded-full glass text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all">
        <X className="h-5 w-5" />
      </button>

      {/* Fundo escuro limpo com identidade AirNext (sem efeito animado) +
          leve textura de pontos discreta. */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Banner / Logo */}
        <div className="flex flex-col items-center text-center mb-6 fade-up">
          <Logo to="/dashboard" size="md" withTouchGlow />
          <div
            className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
            style={{
              background: 'linear-gradient(90deg, rgba(99,102,241,0.22), rgba(34,211,238,0.18))',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#c7d2fe',
            }}
          >
            <Zap className="h-3 w-3 text-[#60A5FA]" /> Ativação de Produto
          </div>
        </div>

        <div className="auth-card slide-up overflow-hidden relative">
          {/* ═══ PHASE: CODE ═══ */}
          {phase === 'code' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/20 mb-4"><Zap className="h-7 w-7 text-[#60A5FA]" /></div>
                <h2 className="text-xl font-bold text-white">Possui um código AirNext?</h2>
                <p className="mt-1.5 text-sm text-zinc-300">Insira o código de ativação que acompanha seu produto</p>
              </div>
              {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-4">{error}</div>}
              <input type="text" inputMode="text" autoCapitalize="characters" value={code} onChange={e=>setCode(formatActivationCode(e.target.value))}
                maxLength={12}
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-4 text-center text-lg font-mono tracking-[.2em] text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 mb-1.5"
                style={{ color: '#ffffff' }}
                placeholder="AIR-XXXXXXXX" />
              <p className="text-center text-[11px] text-zinc-500 mb-4">Digite só as letras e números — os traços são adicionados automaticamente</p>
              <button onClick={handleActivate} disabled={!code.trim() || busy}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 text-sm shadow-lg shadow-[#2563EB]/30" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Validando...</> : <><Zap className="h-4 w-4" />Ativar Produto</>}
              </button>
              
            </div>
          )}

          {/* ═══ PHASE: CATEGORY ═══ */}
          {phase === 'category' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Escolha a categoria</h2>
                <p className="mt-1 text-sm text-zinc-300">O que deseja compartilhar com este produto?</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {CATS.map(c => (
                  <button key={c.id} onClick={() => { setCategory(c.id); setForm({[c.id==='BUSINESS'?'nomeEmpresa':'nome']: user?.name||''}); setPhase('wizard'); setWizStep(1); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all group text-center">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}><c.icon className="h-5 w-5" /></div>
                    <div><p className="font-semibold text-white text-sm">{c.label}</p><p className="text-[10px] text-zinc-600">{c.desc}</p></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ PHASE: WIZARD ═══ */}
          {phase === 'wizard' && (
            <div>
              {/* Step indicator */}
              <div className="flex border-b border-white/5">
                {wizLabels.map((l,i) => {
                  const WI = wizIcons[i];
                  const active = i + 1 === wizStep;
                  const done = i + 1 < wizStep;
                  return (
                    <div key={l} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${active ? 'text-[#60A5FA]' : done ? 'text-emerald-400' : 'text-zinc-700'}`}>
                      <WI className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{l}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 sm:p-8">
                {/* Step 1: Identity */}
                {wizStep === 1 && (
                  <div className="space-y-4 fade-up">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-white">Identidade</h3>
                      <p className="text-xs text-zinc-300">Foto, nome e descrição</p>
                    </div>
                    {/* Avatar placeholder */}
                    <div className="flex justify-center">
                      <div className="h-20 w-20 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                        <Camera className="h-6 w-6 text-zinc-600" />
                      </div>
                    </div>
                    <input className={inp} style={inpStyle} placeholder={namePh} value={form[nameField]||''} onChange={e=>set(nameField,e.target.value)} />
                    <input className={inp} style={inpStyle} placeholder={descPh} value={form[descField]||''} onChange={e=>set(descField,e.target.value)} />
                    <textarea className={inp+' resize-none'} style={inpStyle} rows={2} placeholder={bioPh} value={form[bioField]||''} onChange={e=>set(bioField,e.target.value)} />
                    {/* Slug */}
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">Endereço do perfil</label>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-300 text-xs shrink-0">airnext.com/u/</span>
                        <input className={inp} style={inpStyle} placeholder="joao-silva" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact */}
                {wizStep === 2 && (
                  <div className="space-y-4 fade-up">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-white">Contato</h3>
                      <p className="text-xs text-zinc-300">Como as pessoas falam com você</p>
                    </div>
                    {(STEP2[category]||[]).map(([k,ph]) =>
                      <input key={k} className={inp} style={inpStyle} placeholder={ph} value={form[k]||''} onChange={e=>set(k,e.target.value)} />
                    )}
                  </div>
                )}

                {/* Step 3: Details */}
                {wizStep === 3 && (
                  <div className="space-y-4 fade-up">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {['PET','KIDS','SENIOR','TEA'].includes(category) ? 'Informações' : 'Redes Sociais'}
                      </h3>
                      <p className="text-xs text-zinc-300">Preencha o que desejar</p>
                    </div>
                    {(STEP3[category]||[]).map(([k,ph]) =>
                      ['medicacoes','preferenciaComunicacao','sensibilidades','comoAjudar','descricao'].includes(k) ?
                        <textarea key={k} className={inp+' resize-none'} style={inpStyle} rows={2} placeholder={ph} value={form[k]||''} onChange={e=>set(k,e.target.value)} /> :
                        <input key={k} className={inp} style={inpStyle} placeholder={ph} value={form[k]||''} onChange={e=>set(k,e.target.value)} />
                    )}
                  </div>
                )}

                {/* Step 4: Theme */}
                {wizStep === 4 && (
                  <div className="space-y-4 fade-up">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-white">Tema</h3>
                      <p className="text-xs text-zinc-300">Escolha a aparência do seu perfil</p>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {THEMES.map(t => (
                        <button key={t.id} onClick={()=>setTheme(t.id)}
                          className={`rounded-xl border-2 p-2.5 transition-all ${theme===t.id ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/30' : 'border-white/5 hover:border-white/15'}`}>
                          <div className={`h-14 rounded-lg ${t.bg} mb-2`} />
                          <p className="text-[10px] font-medium text-zinc-300 text-center">{t.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Finish */}
                {wizStep === 5 && (
                  <div className="space-y-4 fade-up text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 mb-2">
                      <PartyPopper className="h-7 w-7 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Tudo pronto!</h3>
                    <p className="text-sm text-zinc-300">Revise e finalize seu perfil</p>
                    <div className="glass rounded-xl p-4 text-left space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-zinc-300">Nome</span><span className="text-white font-medium">{form[nameField]||'—'}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-300">Categoria</span><span className="text-[#60A5FA] font-medium">{CATS.find(c=>c.id===category)?.label}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-300">URL</span><span className="text-white font-mono text-xs">/u/{slug||'...'}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-300">Tema</span><span className="text-white font-medium">{THEMES.find(t=>t.id===theme)?.label}</span></div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => wizStep === 1 ? setPhase('category') : setWizStep(wizStep - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-4 w-4" />Voltar
                  </button>
                  <button onClick={() => {
                    if (wizStep < 5) setWizStep(wizStep + 1);
                    else handleFinish();
                  }} disabled={wizStep === 5 && !slug.trim()}
                    className="flex-1 flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 text-sm shadow-lg shadow-[#2563EB]/30" style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}>
                    {wizStep === 5 ? <><CheckCircle className="h-4 w-4" />Gerar Perfil</> : <>Próximo<ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PHASE: DONE ═══ */}
          {phase === 'done' && (
            <div className="p-8 text-center space-y-5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Perfil Criado! 🎉</h2>
              <p className="text-zinc-300">Seu perfil digital está no ar</p>

              {/* Profile URL card */}
              <div className="glass rounded-2xl p-4 space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Link do seu perfil</p>
                <p className="font-mono text-blue-400 text-sm font-bold">airnext.com/u/{slug}</p>
              </div>

              {/* Inline preview */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 max-h-72 overflow-y-auto hide-scrollbar text-left">
                <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 flex items-center gap-1.5 px-3 z-10 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-red-500/60"/><div className="h-2 w-2 rounded-full bg-amber-500/60"/><div className="h-2 w-2 rounded-full bg-emerald-500/60"/>
                  <span className="text-[9px] text-zinc-500 ml-1 truncate">airnext.com/u/{slug}</span>
                </div>
                <iframe src={`/u/${slug}`} className="w-full h-72 border-none mt-6 block" title="Pré-visualização" />
              </div>

              <p className="text-xs text-zinc-600">⚡ Configurado em menos de 3 minutos!</p>

              {/* CTA principal: Editar Perfil */}
              <button onClick={() => nav(`/dashboard/perfil/${activated?.id || ''}?tab=visual`)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95">
                ✏️ Editar Perfil Agora
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => nav(`/dashboard/perfil/${activated?.id || ''}`)} className="py-3 rounded-xl border border-white/10 font-semibold text-zinc-300 hover:bg-white/5 text-xs transition-all flex flex-col items-center gap-1">
                  <span className="text-base">👁️</span> Ver
                </button>
                <button onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`);}} className="py-3 rounded-xl border border-white/10 font-semibold text-zinc-300 hover:bg-white/5 text-xs transition-all flex flex-col items-center gap-1">
                  <span className="text-base">🔗</span> Copiar
                </button>
                <button onClick={() => nav('/dashboard')} className="py-3 rounded-xl border border-white/10 font-semibold text-zinc-300 hover:bg-white/5 text-xs transition-all flex flex-col items-center gap-1">
                  <span className="text-base">🏠</span> Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
