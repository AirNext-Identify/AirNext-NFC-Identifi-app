import { useMemo, useState } from 'react';
import {
  CheckCircle2, ChevronDown, ExternalLink, EyeOff, MessageCircle, Pencil, Pin, PinOff,
  Plus, Save, Search, Settings2, ShieldCheck, ShieldAlert, Star, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/adminUtils';
import { FEEDBACK_STATUS_LABEL, type FeedbackSettings, type FeedbackStatus, type SiteFeedback } from '@/lib/siteFeedbacks';
import type { FeedbackPatch } from '@/hooks/useSiteFeedbacks';

type NewFeedback = {
  name: string; role: string; rating: number; comment: string; photo_url: string;
  contact_phone: string; contact_email: string; consent_publish: boolean; publish: boolean;
};

interface Props {
  items: SiteFeedback[];
  settings: FeedbackSettings;
  loading: boolean;
  error: string | null;
  onUpdate: (id: string, fields: FeedbackPatch) => void;
  onSetStatus: (id: string, status: FeedbackStatus) => void;
  onDelete: (id: string) => void;
  onAdd: (f: NewFeedback) => Promise<void>;
  onSaveSettings: (s: FeedbackSettings) => Promise<void>;
}

const STATUS_BADGE: Record<FeedbackStatus, string> = {
  pendente: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  publicado: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  oculto: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
};
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const input = 'w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none';

function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
          className={cn(onChange ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default')}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
        >
          <Star size={size} className={n <= value ? 'text-yellow-400' : 'text-zinc-700'} fill={n <= value ? '#facc15' : 'transparent'} />
        </button>
      ))}
    </span>
  );
}

function waLink(phone: string | null, name: string | null) {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}?text=${encodeURIComponent(`Olá${name ? `, ${name}` : ''}! Aqui é da AirNext. Obrigado pelo seu feedback!`)}`;
}

/** Formulário usado para editar um feedback existente e para criar um depoimento manual. */
function FeedbackForm({ initial, submitLabel, withPublish, onSubmit, onCancel }: {
  initial: NewFeedback; submitLabel: string; withPublish?: boolean;
  onSubmit: (v: NewFeedback) => Promise<void> | void; onCancel: () => void;
}) {
  const [v, setV] = useState<NewFeedback>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = <K extends keyof NewFeedback>(k: K, val: NewFeedback[K]) => setV(p => ({ ...p, [k]: val }));
  const submit = async () => {
    if (!v.rating) { setErr('Escolha a quantidade de estrelas.'); return; }
    setSaving(true); setErr('');
    try { await onSubmit(v); } catch (e) { setErr(e instanceof Error ? e.message : 'Erro ao salvar.'); setSaving(false); }
  };
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-zinc-500">Nome (aparece no site)<input className={cn(input, 'mt-1')} value={v.name} onChange={e => set('name', e.target.value)} placeholder="Ex.: Marina Costa" /></label>
        <label className="block text-xs text-zinc-500">Cargo / empresa (aparece no site)<input className={cn(input, 'mt-1')} value={v.role} onChange={e => set('role', e.target.value)} placeholder="Ex.: Arquiteta" /></label>
      </div>
      <div>
        <p className="mb-1 text-xs text-zinc-500">Estrelas</p>
        <Stars value={v.rating} onChange={n => set('rating', n)} size={26} />
      </div>
      <label className="block text-xs text-zinc-500">Comentário (aparece no site)
        <textarea className={cn(input, 'mt-1 resize-none')} rows={4} maxLength={1200} value={v.comment} onChange={e => set('comment', e.target.value)} />
      </label>
      <label className="block text-xs text-zinc-500">Link da foto (opcional)
        <input className={cn(input, 'mt-1')} value={v.photo_url} onChange={e => set('photo_url', e.target.value)} placeholder="https://… (sem foto aparecem as iniciais)" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-zinc-500">WhatsApp (privado)<input className={cn(input, 'mt-1')} value={v.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></label>
        <label className="block text-xs text-zinc-500">E-mail (privado)<input className={cn(input, 'mt-1')} value={v.contact_email} onChange={e => set('contact_email', e.target.value)} /></label>
      </div>
      <label className="flex items-start gap-2 text-sm text-zinc-300">
        <input type="checkbox" className="mt-1" checked={v.consent_publish} onChange={e => set('consent_publish', e.target.checked)} />
        O cliente autorizou publicar o depoimento no site
      </label>
      {withPublish && (
        <label className="flex items-start gap-2 text-sm text-zinc-300">
          <input type="checkbox" className="mt-1" checked={v.publish} onChange={e => set('publish', e.target.checked)} />
          Publicar na landing page agora
        </label>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Salvando…' : submitLabel}
        </button>
        <button onClick={onCancel} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
      </div>
    </div>
  );
}

export function FeedbacksView({ items, settings, loading, error, onUpdate, onSetStatus, onDelete, onAdd, onSaveSettings }: Props) {
  const [tab, setTab] = useState<'pendente' | 'publicado' | 'oculto' | 'todos'>('pendente');
  const [stars, setStars] = useState<'todas' | '1' | '2' | '3' | '4' | '5'>('todas');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cfg, setCfg] = useState<FeedbackSettings>(settings);
  const [cfgMsg, setCfgMsg] = useState('');

  const stats = useMemo(() => {
    const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: items.filter(f => f.rating === n).length }));
    const pub = items.filter(f => f.status === 'publicado');
    const avg = (arr: SiteFeedback[]) => (arr.length ? arr.reduce((a, f) => a + f.rating, 0) / arr.length : 0);
    return {
      total: items.length, pend: items.filter(f => f.status === 'pendente').length, pub: pub.length,
      avgAll: avg(items), avgPub: avg(pub), dist, max: Math.max(1, ...dist.map(d => d.c)),
    };
  }, [items]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(f => {
      if (tab !== 'todos' && f.status !== tab) return false;
      if (stars !== 'todas' && f.rating !== Number(stars)) return false;
      if (!q) return true;
      return [f.name, f.role, f.comment, f.contact_phone, f.contact_email].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [items, tab, stars, query]);

  const tabs = [
    { id: 'pendente' as const, label: 'Pendentes', n: stats.pend },
    { id: 'publicado' as const, label: 'Publicados', n: stats.pub },
    { id: 'oculto' as const, label: 'Ocultos', n: items.filter(f => f.status === 'oculto').length },
    { id: 'todos' as const, label: 'Todos', n: items.length },
  ];

  const publish = (f: SiteFeedback) => {
    if (!f.consent_publish && !confirm('Este cliente NÃO marcou que autoriza publicar o depoimento. Publicar mesmo assim? (Confirme que você tem a autorização dele.)')) return;
    if (!f.comment?.trim() && !confirm('Este feedback não tem comentário, só estrelas. Publicar mesmo assim?')) return;
    onSetStatus(f.id, 'publicado');
  };

  const saveCfg = async () => {
    setCfgMsg('Salvando…');
    try { await onSaveSettings(cfg); setCfgMsg('Salvo! A landing já usa as novas configurações.'); }
    catch (e) { setCfgMsg(e instanceof Error ? e.message : 'Erro ao salvar.'); }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Resumo + distribuição de estrelas */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Média geral', v: stats.total ? `${stats.avgAll.toFixed(1).replace('.', ',')} ★` : '—', t: 'text-yellow-300' },
            { l: 'Média dos publicados', v: stats.pub ? `${stats.avgPub.toFixed(1).replace('.', ',')} ★` : '—', t: 'text-emerald-300' },
            { l: 'Total recebidos', v: stats.total, t: 'text-zinc-100' },
            { l: 'Aguardando você', v: stats.pend, t: 'text-amber-300' },
          ].map(c => (
            <div key={c.l} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-500">{c.l}</p>
              <p className={cn('mt-1 text-2xl font-bold', c.t)}>{c.v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-3 text-xs text-zinc-500">Quantas estrelas (clique para filtrar)</p>
          <div className="space-y-1.5">
            {stats.dist.map(d => (
              <button key={d.n} onClick={() => { setStars(String(d.n) as typeof stars); setTab('todos'); }} className="flex w-full items-center gap-3 text-sm hover:opacity-80">
                <span className="w-8 text-zinc-300">{d.n} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <span className="block h-full rounded-full bg-yellow-400" style={{ width: `${(d.c / stats.max) * 100}%` }} />
                </span>
                <span className="w-6 text-right text-zinc-400">{d.c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Não foi possível carregar os feedbacks: {error}. Se for a primeira vez, rode o arquivo <code>sql/09_feedbacks_site.sql</code> no SQL Editor do Supabase.
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setAdding(v => !v); setEditId(null); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
          <Plus className="h-4 w-4" /> Adicionar depoimento
        </button>
        <button onClick={() => { setShowSettings(v => !v); setCfg(settings); setCfgMsg(''); }} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800">
          <Settings2 className="h-4 w-4" /> Configurar seção da landing
        </button>
        <a href="/#feedbacks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800">
          <ExternalLink className="h-4 w-4" /> Ver na landing
        </a>
      </div>

      {adding && (
        <FeedbackForm
          withPublish submitLabel="Salvar depoimento" onCancel={() => setAdding(false)}
          initial={{ name: '', role: '', rating: 5, comment: '', photo_url: '', contact_phone: '', contact_email: '', consent_publish: false, publish: false }}
          onSubmit={async v => { await onAdd(v); setAdding(false); }}
        />
      )}

      {showSettings && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Seção de feedbacks na landing page</h3>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={cfg.show_section} onChange={e => setCfg({ ...cfg, show_section: e.target.checked })} />
            Mostrar a seção na landing page
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={cfg.show_summary} onChange={e => setCfg({ ...cfg, show_summary: e.target.checked })} />
            Mostrar a nota média e o total de avaliações (calculados dos feedbacks publicados)
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">Texto pequeno acima do título
              <input className={cn(input, 'mt-1')} value={cfg.eyebrow ?? ''} onChange={e => setCfg({ ...cfg, eyebrow: e.target.value || null })} placeholder="Quem Usa Recomenda" />
            </label>
            <label className="block text-xs text-zinc-500">Título
              <input className={cn(input, 'mt-1')} value={cfg.title ?? ''} onChange={e => setCfg({ ...cfg, title: e.target.value || null })} placeholder="Feedbacks de Clientes." />
            </label>
          </div>
          <label className="block text-xs text-zinc-500">Subtítulo (opcional)
            <input className={cn(input, 'mt-1')} value={cfg.subtitle ?? ''} onChange={e => setCfg({ ...cfg, subtitle: e.target.value || null })} />
          </label>
          <p className="text-xs text-zinc-500">Deixe em branco para usar o texto padrão. Enquanto não houver nenhum feedback publicado, a landing continua mostrando os depoimentos atuais do site.</p>
          <div className="flex items-center gap-3">
            <button onClick={saveCfg} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"><Save className="h-4 w-4" /> Salvar</button>
            {cfgMsg && <span className="text-sm text-zinc-400">{cfgMsg}</span>}
          </div>
        </div>
      )}

      {/* Abas e filtros */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('rounded-full px-4 py-2 text-sm font-medium transition', tab === t.id ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800')}>
            {t.label} <span className={cn('ml-1 text-xs', tab === t.id ? 'text-indigo-100' : 'text-zinc-600')}>{t.n}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, comentário, telefone ou e-mail" className={cn(input, 'pl-9')} />
        </div>
        <select value={stars} onChange={e => setStars(e.target.value as typeof stars)} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none">
          <option value="todas">Todas as estrelas</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} estrela{n > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Carregando feedbacks…</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center text-sm text-zinc-500">Nenhum feedback aqui.</div>
      ) : (
        <ul className="space-y-3">
          {list.map(f => {
            const open = openId === f.id;
            const link = waLink(f.contact_phone, f.name);
            return (
              <li key={f.id} className={cn('overflow-hidden rounded-2xl border bg-zinc-900/60', !f.seen ? 'border-indigo-500/50' : 'border-zinc-800')}>
                <button
                  onClick={() => { setOpenId(open ? null : f.id); if (!f.seen) onUpdate(f.id, { seen: true }); }}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={f.rating} />
                      <span className="font-semibold text-zinc-100">{f.name || 'Sem nome'}</span>
                      {f.role && <span className="text-xs text-zinc-500">· {f.role}</span>}
                      {!f.seen && <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Novo</span>}
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', STATUS_BADGE[f.status])}>{FEEDBACK_STATUS_LABEL[f.status]}</span>
                      {f.featured && <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] text-yellow-300">Destaque</span>}
                      {f.consent_publish
                        ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> autorizou publicar</span>
                        : <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500"><ShieldAlert className="h-3.5 w-3.5" /> sem autorização</span>}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">{f.comment || <em className="text-zinc-600">Sem comentário</em>}</p>
                    <p className="mt-1 text-xs text-zinc-600">{fmt(f.created_at)} · origem: {f.source}</p>
                  </div>
                  <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="space-y-4 border-t border-zinc-800 p-4">
                    {editId === f.id ? (
                      <FeedbackForm
                        submitLabel="Salvar alterações" onCancel={() => setEditId(null)}
                        initial={{
                          name: f.name ?? '', role: f.role ?? '', rating: f.rating, comment: f.comment ?? '', photo_url: f.photo_url ?? '',
                          contact_phone: f.contact_phone ?? '', contact_email: f.contact_email ?? '', consent_publish: f.consent_publish, publish: false,
                        }}
                        onSubmit={v => {
                          onUpdate(f.id, {
                            name: v.name.trim() || null, role: v.role.trim() || null, rating: v.rating, comment: v.comment.trim() || null,
                            photo_url: v.photo_url.trim() || null, contact_phone: v.contact_phone.trim() || null,
                            contact_email: v.contact_email.trim() || null, consent_publish: v.consent_publish,
                          });
                          setEditId(null);
                        }}
                      />
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap rounded-xl bg-zinc-950/60 p-3 text-sm text-zinc-300">{f.comment || 'Sem comentário.'}</p>
                        <div className="grid gap-1 text-sm text-zinc-400 sm:grid-cols-2">
                          <p>WhatsApp: <span className="text-zinc-200">{f.contact_phone || '—'}</span></p>
                          <p>E-mail: <span className="text-zinc-200">{f.contact_email || '—'}</span></p>
                          <p>Recebido em: <span className="text-zinc-200">{fmt(f.created_at)}</span></p>
                          <p>Publicado em: <span className="text-zinc-200">{fmt(f.published_at)}</span></p>
                        </div>
                        <label className="block text-xs text-zinc-500">Anotações internas (ninguém vê no site)
                          <textarea
                            defaultValue={f.admin_notes ?? ''} rows={2}
                            onBlur={e => { if (e.target.value !== (f.admin_notes ?? '')) onUpdate(f.id, { admin_notes: e.target.value || null }); }}
                            className={cn(input, 'mt-1 resize-none')}
                          />
                        </label>
                      </>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {f.status !== 'publicado' ? (
                        <button onClick={() => publish(f)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                          <CheckCircle2 className="h-4 w-4" /> Publicar na landing
                        </button>
                      ) : (
                        <button onClick={() => onSetStatus(f.id, 'oculto')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                          <EyeOff className="h-4 w-4" /> Tirar do site
                        </button>
                      )}
                      {f.status === 'pendente' && (
                        <button onClick={() => onSetStatus(f.id, 'oculto')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                          <EyeOff className="h-4 w-4" /> Não publicar
                        </button>
                      )}
                      {f.status === 'publicado' && (
                        <button onClick={() => onUpdate(f.id, { featured: !f.featured })} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                          {f.featured ? <><PinOff className="h-4 w-4" /> Tirar destaque</> : <><Pin className="h-4 w-4" /> Destacar (aparece primeiro)</>}
                        </button>
                      )}
                      {editId !== f.id && (
                        <button onClick={() => setEditId(f.id)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                      )}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/50 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10">
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => { if (confirm('Apagar este feedback de vez? Isso não pode ser desfeito.')) onDelete(f.id); }}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" /> Apagar
                      </button>
                    </div>
                    {f.status === 'publicado' && (
                      <p className="text-xs text-zinc-600">Para corrigir texto, nome ou estrelas use “Editar” — a landing mostra a versão editada.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
