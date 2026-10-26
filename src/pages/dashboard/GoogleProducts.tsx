import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, ExternalLink, Pencil, Check, X, Loader2, Lock, Link2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import GoogleAnalytics from './GoogleAnalytics';
import type { Product } from '../../types/product';
import { GOOGLE_URL_HELP, isValidGoogleReviewUrl, normalizeGoogleReviewUrl } from '../../lib/googleReview';

/**
 * AirNext Google — plaquinhas de avaliação. Não têm perfil público: o QR Code
 * (permanente) só redireciona para o link de avaliações cadastrado aqui.
 * Trocar o link NÃO exige reimprimir a plaquinha.
 */
function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface ScanStat {
  product_id: string;
  total: number;
  last_7d: number;
  last_30d: number;
  nfc: number;
  qr: number;
  last_at: string | null;
  daily?: { d: string; n: number }[];
}

/** Escaneamentos (QR + NFC) da plaquinha: totais e gráfico dos últimos 14 dias. */
function ScanStats({ stat }: { stat?: ScanStat }) {
  const total = stat?.total ?? 0;
  const daily = stat?.daily ?? [];
  const max = Math.max(1, ...daily.map(x => x.n));
  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Escaneamentos</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { l: 'Total', v: total },
          { l: '7 dias', v: stat?.last_7d ?? 0 },
          { l: '30 dias', v: stat?.last_30d ?? 0 },
          { l: 'NFC / QR', v: `${stat?.nfc ?? 0} / ${stat?.qr ?? 0}` },
        ].map(x => (
          <div key={x.l} className="bg-white/[0.03] rounded-lg py-2">
            <p className="text-sm font-bold text-white">{typeof x.v === 'number' ? x.v.toLocaleString('pt-BR') : x.v}</p>
            <p className="text-[10px] text-zinc-600">{x.l}</p>
          </div>
        ))}
      </div>
      {daily.length > 0 && total > 0 && (
        <div className="mt-2 flex items-end gap-[3px] h-10" aria-label="Escaneamentos nos últimos 14 dias">
          {daily.map(x => (
            <div key={x.d} title={`${new Date(x.d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: ${x.n}`}
              className="flex-1 rounded-sm bg-amber-400/70" style={{ height: `${Math.max(x.n > 0 ? 12 : 4, (x.n / max) * 100)}%`, opacity: x.n > 0 ? 1 : 0.25 }} />
          ))}
        </div>
      )}
      <p className="mt-1 text-[11px] text-zinc-600">
        {stat?.last_at ? `Último escaneamento em ${formatDate(stat.last_at)}` : 'Ainda sem escaneamentos'}
        {daily.length > 0 && total > 0 ? ' · gráfico dos últimos 14 dias' : ''}
      </p>
    </div>
  );
}

function GoogleCard({ p, stat }: { p: Product; stat?: ScanStat }) {
  const { updateGoogleRedirect } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(p.redirectUrl || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const blocked = p.status === 'BLOQUEADO';
  const clean = normalizeGoogleReviewUrl(value);
  const valid = isValidGoogleReviewUrl(clean);

  const save = async () => {
    if (!valid) { setError(GOOGLE_URL_HELP); return; }
    setBusy(true); setError('');
    const r = await updateGoogleRedirect(p.id, clean);
    setBusy(false);
    if (!r.ok) { setError(r.error || 'Não foi possível salvar o link.'); return; }
    setEditing(false); setSaved(true);
    window.setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Star className="h-5 w-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">Plaquinha AirNext Google</p>
          <p className="text-white/50 text-xs font-mono">{p.activationCode}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${blocked ? 'bg-zinc-500/20 text-zinc-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {blocked ? 'Bloqueada' : 'Ativa'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Destino do QR Code</p>
          {editing ? (
            <div className="space-y-2">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus
                  value={value} onChange={e => { setValue(e.target.value); if (error) setError(''); }}
                  placeholder="https://g.page/r/..../review"
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              {value.trim() && !valid && <p className="text-[11px] text-amber-300">{GOOGLE_URL_HELP}</p>}
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button onClick={save} disabled={!valid || busy}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar
                </button>
                <button onClick={() => { setEditing(false); setValue(p.redirectUrl || ''); setError(''); }} disabled={busy}
                  className="px-4 flex items-center justify-center gap-1.5 border border-white/10 text-zinc-300 hover:bg-white/5 text-sm font-medium rounded-xl transition-colors">
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-blue-400 break-all">{p.redirectUrl || 'Link não configurado'}</p>
          )}
        </div>

        {saved && <p className="text-[12px] text-emerald-400 flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Link atualizado — o mesmo QR Code já aponta para o novo destino.</p>}

        <ScanStats stat={stat} />

        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>Ativada em {formatDate(p.activatedAt)}</span>
          <span>Sem prazo de validade</span>
        </div>

        {blocked ? (
          <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[12px] text-amber-300">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Esta plaquinha está bloqueada e não redireciona. Fale com o suporte AirNext.</span>
          </div>
        ) : !editing && (
          <div className="grid grid-cols-2 gap-2">
            {p.redirectUrl && (
              <a href={p.redirectUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/10 text-zinc-200 hover:bg-white/5 text-sm font-medium transition-colors">
                <ExternalLink className="h-4 w-4" /> Testar
              </a>
            )}
            <button onClick={() => { setEditing(true); setSaved(false); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors ${p.redirectUrl ? '' : 'col-span-2'}`}>
              <Pencil className="h-4 w-4" /> Alterar link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleProducts() {
  const { googleProducts } = useAuth();
  const [stats, setStats] = useState<Record<string, ScanStat>>({});

  // Escaneamentos das plaquinhas do cliente (função do banco: só devolve as DELE).
  useEffect(() => {
    if (googleProducts.length === 0) return;
    let alive = true;
    supabase.rpc('google_scan_stats', { p_daily: true }).then(({ data, error }) => {
      if (!alive || error || !Array.isArray(data)) return;
      const m: Record<string, ScanStat> = {};
      (data as ScanStat[]).forEach(r => { m[r.product_id] = r; });
      setStats(m);
    });
    return () => { alive = false; };
  }, [googleProducts.length]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">AirNext Google</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Suas plaquinhas de avaliação — o QR Code leva direto para o seu link.</p>
        </div>
        <Link to="/ativar" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors">
          <Plus className="h-4 w-4" /> Ativar nova plaquinha
        </Link>
      </div>

      {googleProducts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Star className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">Nenhuma plaquinha ativada</h3>
          <p className="text-zinc-500 text-sm">Ative sua plaquinha com o código que acompanha o produto.</p>
        </div>
      ) : (
        <>
          <GoogleAnalytics products={googleProducts} />
          <div className="grid gap-4 md:grid-cols-2">
            {googleProducts.map(p => <GoogleCard key={p.id} p={p} stat={stats[p.id]} />)}
          </div>
        </>
      )}
    </div>
  );
}
