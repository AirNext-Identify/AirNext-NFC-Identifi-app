import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Palette, Plus, User, Grid, CheckCircle2, X, Loader2, GripVertical, Smartphone, Sparkles } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { BrandIcon } from '../../components/Icons';
import { QRCodeSVG } from 'qrcode.react';

const WALLPAPERS = [
  { id: 'glass-dark', label: 'Tesla', css: 'bg-zinc-950', preview: 'bg-zinc-900' },
  { id: 'glass-light', label: 'Apple', css: 'bg-white', preview: 'bg-zinc-100' },
  { id: 'grad-flux', label: 'Indigo', css: 'bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700', preview: 'bg-indigo-600' },
  { id: '4k-abstract', label: 'Liquid', css: 'bg-[url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop")] bg-cover bg-center', preview: 'bg-slate-700' },
];

const SOCIAL_ITEMS = [
  { id: 'whatsapp', label: 'WhatsApp' }, { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' }, { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' }, { id: 'telegram', label: 'Telegram' },
  { id: 'spotify', label: 'Spotify' }, { id: 'github', label: 'GitHub' },
];

export default function ProfileCustomizer() {
  const { productId } = useParams<{ productId: string }>();
  const { products, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const product = products.find(p => p.id === productId);

  const [activeTab, setActiveTab] = useState<'info' | 'grid' | 'style'>('info');
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [justSynced, setJustSynced] = useState(false);
  const [config, setConfig] = useState({
    wallpaper: 'bg-zinc-950',
    wallpaperId: 'glass-dark',
    gridOrder: SOCIAL_ITEMS.map(s => s.id),
  });

  useEffect(() => {
    if (product) {
      setForm(product.profileData ? { ...(product.profileData as any), _slug: product.slug } : {});
    }
  }, [product]);

  // Dispara um breve "flash" visual no mockup sempre que algo muda no editor,
  // reforçando que a prévia está sincronizada em tempo real com o que é digitado.
  useEffect(() => {
    setJustSynced(true);
    const t = setTimeout(() => setJustSynced(false), 900);
    return () => clearTimeout(t);
  }, [JSON.stringify(form), JSON.stringify(config)]);

  if (!product) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex items-center gap-2 text-white"><Loader2 className="h-5 w-5 animate-spin text-blue-400" /><span>Carregando editor...</span></div>
    </div>
  );

  const handleSave = async () => {
    setIsSaving(true);
    const { _slug, ...data } = form;
    updateProfile(product.id, data);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    toast.show('Perfil atualizado com sucesso!', 'success');
  };

  const handleDrop = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const newOrder = [...config.gridOrder];
    const fromIdx = newOrder.indexOf(sourceId);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, sourceId);
    setConfig({ ...config, gridOrder: newOrder });
  };

  const initials = (form.nome || form.nomeEmpresa || 'A')[0].toUpperCase();
  const socialItems = config.gridOrder.filter((id: string) => form[id]);

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface/90 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => navigate('/dashboard')} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/5 text-zinc-400"><X className="h-5 w-5" /></button>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMode('edit')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mobileMode==='edit' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>Editar</button>
          <button onClick={() => setMobileMode('preview')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${mobileMode==='preview' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>Prévia</button>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 disabled:opacity-50 text-white px-5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
        </button>
      </header>

      {/* LEFT: Editor */}
      <aside className={`${mobileMode==='preview' ? 'hidden' : 'flex'} lg:flex w-full lg:w-[420px] xl:w-[480px] flex-col border-r border-white/5 bg-surface-900/50 overflow-hidden`}>
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400"><X className="h-5 w-5" /></button>
            <div className="h-5 w-px bg-white/5" />
            <h1 className="text-sm font-bold text-white tracking-tight">Editor Apple</h1>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 disabled:opacity-50 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar Alterações
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pt-4 pb-3 border-b border-white/5 overflow-x-auto hide-scrollbar shrink-0">
          {([['info', 'Dados', User], ['grid', 'Apps', Grid], ['style', 'Visual', Palette]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab===id ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 hide-scrollbar pb-28">
          {activeTab==='info' && (
            <div className="space-y-6 fade-up">
              <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5">
                <div className="relative group h-16 w-16 rounded-[1.2rem] bg-zinc-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50 shrink-0">
                  {form.foto ? <img src={form.foto} className="w-full h-full object-cover"/> : <Plus className="h-5 w-5 text-zinc-600"/>}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onload=()=>setForm(p=>({...p, foto: r.result})); r.readAsDataURL(f);}}} />
                </div>
                <div className="min-w-0"><p className="text-xs font-bold text-white">Foto</p><p className="text-[10px] text-zinc-500 truncate">Clique para trocar a imagem</p></div>
              </div>
              <div className="space-y-3">
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700" placeholder="Nome" value={form.nome||''} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700" placeholder="Bio curta" value={form.cargo||form.descricao||''} onChange={e=>setForm(p=>({...p,cargo:e.target.value}))} />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700 h-24 resize-none" placeholder="Biografia completa..." value={form.bio||''} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} />
              </div>
              <div className="pt-4 border-t border-white/5 space-y-3 fade-up">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider ml-1">Contatos</p>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700" placeholder="WhatsApp (5511999999999)" value={form.whatsapp||''} onChange={e=>setForm(p=>({...p,whatsapp:e.target.value}))} />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700" placeholder="Telefone" value={form.telefone||''} onChange={e=>setForm(p=>({...p,telefone:e.target.value}))} />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-700" placeholder="E-mail" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
              </div>
            </div>
          )}

          {activeTab==='grid' && (
            <div className="space-y-2 fade-up">
              <div className="p-3 mb-4 rounded-2xl bg-blue-500/5 border border-blue-500/10"><p className="text-xs font-semibold text-blue-400">Arraste os aplicativos para reorganizar</p></div>
              {config.gridOrder.map(id => {
                const item = SOCIAL_ITEMS.find(s=>s.id===id); if(!item) return null;
                return (
                  <div key={id} draggable onDragStart={e=>e.dataTransfer.setData('id',id)} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e.dataTransfer.getData('id'),id)}
                    className="flex items-center gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/5 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all group">
                    <GripVertical className="h-4 w-4 text-zinc-700 shrink-0" />
                    <BrandIcon name={id} className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{item.label}</span>
                    <input className="bg-transparent border-none text-right text-xs text-blue-400 placeholder:text-zinc-700 w-24 sm:w-32" placeholder="@user" value={form[id]||''} onChange={e=>setForm(p=>({...p,[id]:e.target.value}))} />
                  </div>
                );
              })}
            </div>
          )}

          {activeTab==='style' && (
            <div className="space-y-6 fade-up">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Fundo</p>
              <div className="grid grid-cols-2 gap-3">
                {WALLPAPERS.map(w => (
                  <button key={w.id} onClick={()=>setConfig({...config,wallpaper:w.css,wallpaperId:w.id})}
                    className={`group relative aspect-[4/5] rounded-[1.5rem] overflow-hidden border-2 transition-all ${config.wallpaperId===w.id?'border-blue-500 scale-[1.02]':'border-white/5 hover:border-white/10'}`}>
                    <div className={`absolute inset-0 ${w.preview} ${w.css}`} />
                    <div className="absolute bottom-2 left-2"><p className="text-[9px] font-black text-white uppercase">{w.label}</p></div>
                    {config.wallpaperId===w.id&&<div className="absolute top-2 right-2 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 className="h-3 w-3 text-white"/></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT: Live Preview iPhone 16 */}
      <main className={`flex-1 bg-gradient-to-br from-zinc-950 via-surface-900 to-zinc-950 flex items-center justify-center p-3 sm:p-6 lg:p-12 transition-all duration-500 ${mobileMode==='edit' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="w-full max-w-[380px] group">
          {/* Badge de sincronização em tempo real */}
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
              <div className="absolute top-0 inset-x-0 h-10 z-[100] flex justify-center pt-3">
                <div className="w-[120px] h-[26px] bg-black rounded-full ring-[0.5px] ring-white/5" />
              </div>
              <div className={`h-full overflow-y-auto hide-scrollbar ${config.wallpaper} transition-all duration-700`}>
                <div className="flex flex-col items-center p-6 pt-14 pb-8 min-h-full text-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white/10 border-[4px] border-white/20 shadow-2xl flex items-center justify-center overflow-hidden mb-4">
                    {form.foto ? <img src={form.foto} className="w-full h-full object-cover"/> : <span className="text-3xl sm:text-4xl font-black text-white">{initials}</span>}
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight">{form.nome||form.nomeEmpresa||'Seu Nome'}</h2>
                  <p className="text-white/60 text-xs mt-1">{form.cargo||form.descricao||'Bio'}</p>
                  {form.bio && <p className="text-white/40 text-[11px] mt-3 line-clamp-3 max-w-[260px]">{form.bio}</p>}

                  {socialItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-10 w-full px-2">
                      {socialItems.slice(0,9).map((id:string) => (
                        <div key={id} className="aspect-square rounded-[1.2rem] bg-white/10 flex items-center justify-center border border-white/5 shadow-inner hover:scale-105 transition-transform">
                          <BrandIcon name={id} className="w-6 h-6" />
                        </div>
                      ))}
                    </div>
                  )}

                  {form.whatsapp && (
                    <div className="w-full mt-10 px-2">
                      <div className="bg-[#25D366] rounded-[1.5rem] py-4 flex items-center justify-center gap-2 shadow-lg">
                        <BrandIcon name="whatsapp" className="w-5 h-5 fill-white" />
                        <span className="text-xs font-bold text-white">WhatsApp</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-10 mb-6">
                    <div className="bg-white p-2.5 rounded-[1.5rem] shadow-xl">
                      <QRCodeSVG value={`u/${form._slug||'...'}`} size={90} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-white/25">
                    <Sparkles className="h-3 w-3" />
                    <p className="text-[8px] font-bold uppercase tracking-[.3em]">Ao Vivo</p>
                  </div>
                </div>
              </div>
            </div>
          </button>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Smartphone className="h-4 w-4 text-blue-500"/> 
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[.2em]">
              {product.slug ? 'Toque para abrir o perfil real' : 'Apple Live Preview'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
