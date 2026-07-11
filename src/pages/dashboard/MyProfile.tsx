import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, ProfileTheme } from '../../contexts/AuthContext';

import {
  Save,
  X,
  Loader2,
  Plus,
  User as UserIcon,
  Rows3,
  Palette as PaletteIcon,
  Eye as EyeIcon,
  GripVertical,
  CheckCircle2,
  Smartphone,
  Sparkles,
  MapPin,
  Globe,
  Lock,
  EyeOff
} from 'lucide-react';

import { useToast } from '../../components/Toast';
import { BrandIcon } from '../../components/Icons';
import { QRCodeSVG } from 'qrcode.react';
const THEMES: { id: ProfileTheme; label: string; bg: string }[] = [
  { id: 'escuro', label: 'Tesla', bg: 'bg-zinc-950' },
  { id: 'claro', label: 'Apple', bg: 'bg-zinc-100' },
  { id: 'moderno', label: 'Indigo', bg: 'bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700' },
  { id: 'minimalista', label: 'Minimal', bg: 'bg-white' },
  { id: 'empresarial', label: 'Business', bg: 'bg-slate-950' },
];

type FieldDef = { key: string; label: string; type?: string; icon?: string };
const FIELDS: Record<string, FieldDef[]> = {
  PERSONAL: [
    { key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }, { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' }, { key: 'telefone', label: 'Telefone' }, { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'instagram', label: 'Instagram', icon: 'instagram' }, { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { key: 'facebook', label: 'Facebook', icon: 'facebook' }, { key: 'tiktok', label: 'TikTok', icon: 'tiktok' },
    { key: 'youtube', label: 'YouTube', icon: 'youtube' }, { key: 'site', label: 'Website' }, { key: 'endereco', label: 'Localização' },
  ],
  BUSINESS: [
    { key: 'nomeEmpresa', label: 'Empresa' }, { key: 'descricao', label: 'Descrição', type: 'textarea' },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' }, { key: 'telefone', label: 'Telefone' }, { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'endereco', label: 'Endereço' }, { key: 'instagram', label: 'Instagram', icon: 'instagram' }, { key: 'site', label: 'Website' }, { key: 'catalogo', label: 'Catálogo' },
  ],
  PET: [
    { key: 'nome', label: 'Nome do Pet' }, { key: 'raca', label: 'Raça' }, { key: 'idade', label: 'Idade' },
    { key: 'tutor', label: 'Tutor' }, { key: 'whatsappTutor', label: 'WhatsApp Tutor', icon: 'whatsapp' },
    { key: 'veterinario', label: 'Veterinário' }, { key: 'vacinas', label: 'Vacinas' }, { key: 'alergias', label: 'Alergias' },
    { key: 'medicamentos', label: 'Medicamentos' }, { key: 'contatoEmergencia', label: 'Emergência' },
  ],
  KIDS: [
    { key: 'nome', label: 'Nome' }, { key: 'responsavel1', label: 'Responsável 1' }, { key: 'telefoneResp1', label: 'Tel. Resp. 1' },
    { key: 'responsavel2', label: 'Responsável 2' }, { key: 'telefoneResp2', label: 'Tel. Resp. 2' },
    { key: 'escola', label: 'Escola' }, { key: 'alergias', label: 'Alergias' }, { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' }, { key: 'contatoEmergencia', label: 'Emergência' },
  ],
  SENIOR: [
    { key: 'nome', label: 'Nome' }, { key: 'contatoEmergencia1', label: 'Emergência 1' }, { key: 'telefoneEmerg1', label: 'Tel. 1' },
    { key: 'contatoEmergencia2', label: 'Emergência 2' }, { key: 'telefoneEmerg2', label: 'Tel. 2' },
    { key: 'medicacoes', label: 'Medicações', type: 'textarea' }, { key: 'medicoResponsavel', label: 'Médico' }, { key: 'tipoSanguineo', label: 'Tipo Sanguíneo' },
  ],
  TEA: [
    { key: 'nome', label: 'Nome' }, { key: 'responsavel', label: 'Responsável' }, { key: 'telefoneResponsavel', label: 'Tel. Resp.' },
    { key: 'preferenciaComunicacao', label: 'Comunicação', type: 'textarea' }, { key: 'sensibilidades', label: 'Sensibilidades', type: 'textarea' },
    { key: 'comoAjudar', label: 'Como me ajudar', type: 'textarea' }, { key: 'contatoEmergencia', label: 'Emergência' },
  ],
};

type TabId = 'info' | 'organizar' | 'aparencia' | 'visibilidade';
const TABS: { id: TabId; label: string; Icon: typeof UserIcon }[] = [
  { id: 'info', label: 'Dados', Icon: UserIcon },
  { id: 'organizar', label: 'Organizar', Icon: Rows3 },
  { id: 'aparencia', label: 'Estilo', Icon: PaletteIcon },
  { id: 'visibilidade', label: 'Acesso', Icon: EyeIcon },
];

export default function MyProfile() {
  const { productId } = useParams<{ productId: string }>();
  const { products, updateProfile, updateTheme, updateVisibility } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const product = products.find(p => p.id === productId);

  const [tab, setTab] = useState<TabId>('info');
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    setJustSynced(true);
    const t = setTimeout(() => setJustSynced(false), 900);
    return () => clearTimeout(t);
  }, [JSON.stringify(form), JSON.stringify(order), JSON.stringify(hiddenFields)]);

  useEffect(() => {
    if (product) {
      const data = product.profileData ? { ...(product.profileData as any) } : {};
      const cat = product.category || 'PERSONAL';
      const allKeys = (FIELDS[cat] || FIELDS.PERSONAL).map(f => f.key);
      setForm(data);
      setHiddenFields(data.__hiddenFields || []);
      setOrder(data.__order || allKeys);
    }
  }, [product?.id]);

  if (!product) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>;

  const cat = product.category || 'PERSONAL';
  const fields = FIELDS[cat] || FIELDS.PERSONAL;
  const visibility = product.visibility || 'public';

  const handleSave = async () => {
    setIsSaving(true);
    updateProfile(product.id, { ...form, __hiddenFields: hiddenFields, __order: order } as any);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    toast.show('Perfil salvo com sucesso!', 'success');
  };

  const setField = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleHidden = (k: string) => setHiddenFields(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  const handleDrop = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const newOrder = [...order];
    newOrder.splice(newOrder.indexOf(sourceId), 1);
    newOrder.splice(newOrder.indexOf(targetId), 0, sourceId);
    setOrder(newOrder);
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700 transition-all";
  const orderedFields = order.map(k => fields.find(f => f.key === k)).filter(Boolean) as FieldDef[];
  const initials = (form.nome || form.nomeEmpresa || 'A')[0]?.toUpperCase() || 'A';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface/90 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => navigate('/dashboard')} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/5 text-zinc-400"><X className="h-5 w-5" /></button>
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-full">
          <button onClick={() => setMobileMode('edit')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mobileMode === 'edit' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>Editar</button>
          <button onClick={() => setMobileMode('preview')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mobileMode === 'preview' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>Prévia</button>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
        </button>
      </header>

      {/* LEFT: Editor */}
      <aside className={`${mobileMode === 'preview' ? 'hidden' : 'flex'} lg:flex w-full lg:w-[460px] flex-col border-r border-white/5 bg-surface-900/40 overflow-hidden`}>
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400"><X className="h-5 w-5" /></button>
            <div><h1 className="text-sm font-bold text-white">Meu Perfil</h1><p className="text-[10px] text-zinc-600">Edite, organize e personalize</p></div>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 disabled:opacity-50 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-4 pb-3 border-b border-white/5 overflow-x-auto hide-scrollbar shrink-0">
          {TABS.map(t => {
            const Ic = t.Icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>
                <Ic className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar pb-28">
          {tab === 'info' && (
            <div className="space-y-6 fade-up">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="relative group h-16 w-16 rounded-2xl bg-zinc-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50 shrink-0">
                  {form.foto ? <img src={form.foto} className="w-full h-full object-cover" /> : <Plus className="h-5 w-5 text-zinc-600" />}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setField('foto', r.result); r.readAsDataURL(f); } }} />
                </div>
                <div className="min-w-0"><p className="text-xs font-bold text-white">Foto de Perfil</p><p className="text-[10px] text-zinc-500">Toque para alterar</p></div>
              </div>
              <div className="space-y-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 ml-1">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea className={inp + ' h-24 resize-none'} value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.label} />
                    ) : (
                      <input type={f.type || 'text'} className={inp} value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.label} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'organizar' && (
            <div className="space-y-3 fade-up">
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-xs font-semibold text-blue-400">Arraste para reordenar</p>
                <p className="text-[10px] text-blue-400/60 mt-0.5">Ative/desative cada bloco. As mudanças aparecem na prévia ao vivo.</p>
              </div>
              {orderedFields.map(f => {
                const isHidden = hiddenFields.includes(f.key);
                return (
                  <div key={f.key} draggable onDragStart={e => e.dataTransfer.setData('id', f.key)} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e.dataTransfer.getData('id'), f.key)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-grab active:cursor-grabbing transition-all ${isHidden ? 'bg-transparent border-white/5 opacity-50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                    <GripVertical className="h-4 w-4 text-zinc-700 shrink-0" />
                    {f.icon ? <BrandIcon name={f.icon} className="w-5 h-5 shrink-0" /> : <div className="w-5 h-5 shrink-0" />}
                    <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{f.label}</span>
                    <button onClick={() => toggleHidden(f.key)} className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${isHidden ? 'bg-zinc-700' : 'bg-blue-500'}`}>
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isHidden ? 'translate-x-0.5' : 'translate-x-5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'aparencia' && (
            <div className="space-y-6 fade-up">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">Tema</p>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => updateTheme(product.id, t.id)}
                    className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all ${product.theme === t.id ? 'border-blue-500 scale-[1.02]' : 'border-white/5 hover:border-white/10'}`}>
                    <div className={`absolute inset-0 ${t.bg}`} />
                    <div className="absolute bottom-2 left-2"><p className="text-[10px] font-black text-white uppercase drop-shadow">{t.label}</p></div>
                    {product.theme === t.id && <div className="absolute top-2 right-2 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'visibilidade' && (
            <div className="space-y-6 fade-up">
              <div>
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 ml-1">Quem pode ver</p>
                <div className="space-y-2">
                  {([
                    { id: 'public', label: 'Público', desc: 'Qualquer pessoa com o link ou NFC', Icon: Globe },
                    { id: 'private', label: 'Privado', desc: 'Apenas com link direto', Icon: Lock },
                    { id: 'hidden', label: 'Oculto', desc: 'Ninguém consegue acessar', Icon: EyeOff },
                  ]).map(v => {
                    const Ic = v.Icon;
                    return (
                      <button key={v.id} onClick={() => updateVisibility(product.id, v.id as any)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${visibility === v.id ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 hover:border-white/10'}`}>
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${visibility === v.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-500'}`}><Ic className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">{v.label}</p><p className="text-[10px] text-zinc-500">{v.desc}</p></div>
                        {visibility === v.id && <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(form.endereco || cat === 'BUSINESS') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Localização (Maps)</p>
                    <button onClick={() => toggleHidden('endereco')} className={`relative w-9 h-5 rounded-full transition-colors ${hiddenFields.includes('endereco') ? 'bg-zinc-700' : 'bg-blue-500'}`}>
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${hiddenFields.includes('endereco') ? 'translate-x-0.5' : 'translate-x-4'}`} />
                    </button>
                  </div>
                  {form.endereco && !hiddenFields.includes('endereco') ? (
                    <div className="rounded-2xl overflow-hidden border border-white/10 mt-2">
                      <iframe title="Map" className="w-full h-44" src={`https://maps.google.com/maps?q=${encodeURIComponent(form.endereco)}&output=embed`} loading="lazy" />
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-600 ml-1 mt-1">{form.endereco ? 'Localização oculta no perfil' : 'Adicione um endereço na aba Dados'}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT: Live Preview */}
      <main className={`flex-1 bg-gradient-to-br from-zinc-950 via-surface-900 to-zinc-950 flex items-center justify-center p-4 sm:p-6 lg:p-12 ${mobileMode === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="w-full max-w-[360px]">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[.2em]">Sincronizado em tempo real</p>
          </div>
          <button
            type="button"
            onClick={() => { if (product.slug) window.open(`/u/${product.slug}`, '_blank'); }}
            title={product.slug ? 'Abrir perfil público em uma nova aba' : undefined}
            className={`w-full text-left rounded-[3rem] transition-all duration-500 ${product.slug ? 'cursor-pointer hover:scale-[1.015] active:scale-[0.99]' : 'cursor-default'} ${justSynced ? 'ring-4 ring-emerald-400/50' : 'ring-0 ring-transparent'}`}
          >
            <div className="bg-[#0a0a0a] rounded-[3rem] border-[12px] border-[#1c1c1e] shadow-[0_0_100px_-30px_rgba(59,130,246,0.15)] overflow-hidden aspect-[9/19.5] relative ring-[0.5px] ring-white/5">
              <div className="absolute top-0 inset-x-0 h-10 z-[100] flex justify-center pt-3"><div className="w-[110px] h-[26px] bg-black rounded-full ring-[0.5px] ring-white/5" /></div>
              <div className="h-full overflow-y-auto hide-scrollbar">
                <Preview form={form} order={order} hidden={hiddenFields} theme={product.theme} initials={initials} slug={product.slug} />
              </div>
            </div>
          </button>
          <div className="flex items-center justify-center gap-2 mt-4"><Smartphone className="h-4 w-4 text-blue-500" /><p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[.2em]">{product.slug ? 'Toque para abrir o perfil real' : 'Prévia ao Vivo'}</p></div>
        </div>
      </main>
    </div>
  );
}

function Preview({ form, order, hidden, theme, initials, slug }: any) {
  const bg: Record<string, string> = { escuro: 'bg-zinc-950', claro: 'bg-zinc-50', moderno: 'bg-gradient-to-br from-blue-700 via-violet-700 to-purple-800', minimalista: 'bg-white', empresarial: 'bg-slate-950' };
  const tx: Record<string, string> = { escuro: 'text-white', claro: 'text-zinc-900', moderno: 'text-white', minimalista: 'text-zinc-800', empresarial: 'text-white' };
  const sb: Record<string, string> = { escuro: 'text-zinc-500', claro: 'text-zinc-500', moderno: 'text-white/70', minimalista: 'text-zinc-400', empresarial: 'text-slate-500' };
  const card: Record<string, string> = { escuro: 'bg-white/5', claro: 'bg-zinc-100', moderno: 'bg-white/10', minimalista: 'bg-zinc-100', empresarial: 'bg-white/5' };
  const socialKeys = ['whatsapp', 'whatsappTutor', 'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'telegram', 'spotify', 'github'];
  const visibleFields = order.filter((k: string) => !hidden.includes(k) && form[k]);
  const socials = visibleFields.filter((k: string) => socialKeys.includes(k));

  return (
    <div className={`min-h-full ${bg[theme] || bg.escuro} ${tx[theme]} flex flex-col items-center p-6 pt-14 pb-8 text-center`}>
      <div className="w-24 h-24 rounded-[2rem] border-[4px] border-white/20 shadow-2xl flex items-center justify-center overflow-hidden mb-4">
        {form.foto ? <img src={form.foto} className="w-full h-full object-cover" /> : <span className="text-3xl font-black">{initials}</span>}
      </div>
      <h2 className="text-2xl font-black leading-tight">{form.nome || form.nomeEmpresa || 'Seu Nome'}</h2>
      <p className={`text-xs mt-1 ${sb[theme]}`}>{form.cargo || form.descricao || form.raca || 'Título'}</p>
      {form.bio && !hidden.includes('bio') && <p className={`text-[11px] mt-3 max-w-[260px] leading-relaxed ${sb[theme]}`}>{form.bio}</p>}

      {socials.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-8 w-full">
          {socials.map((id: string) => (
            <div key={id} className={`aspect-square rounded-2xl ${card[theme]} flex items-center justify-center border border-white/5`}>
              <BrandIcon name={id === 'whatsappTutor' ? 'whatsapp' : id} className="w-6 h-6" />
            </div>
          ))}
        </div>
      )}

      {form.whatsapp && !hidden.includes('whatsapp') && (
        <div className="w-full mt-8"><div className="bg-[#25D366] rounded-2xl py-4 flex items-center justify-center gap-2"><BrandIcon name="whatsapp" className="w-5 h-5 fill-white" /><span className="text-xs font-bold text-white">WhatsApp</span></div></div>
      )}

      <div className="mt-10 mb-6 bg-white p-2.5 rounded-2xl shadow-xl"><QRCodeSVG value={`airnext.com/u/${slug || '...'}`} size={90} /></div>
      <div className="flex items-center gap-1.5 opacity-20"><Sparkles className="h-3 w-3" /><p className="text-[8px] font-bold uppercase tracking-[.3em]">Ao Vivo</p></div>
    </div>
  );
}
