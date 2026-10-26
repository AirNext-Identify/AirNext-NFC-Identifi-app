import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, Nfc, QrCode, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types/product';

interface Analytics {
  days: number;
  total: number;
  previous_total: number;
  nfc: number;
  qr: number;
  last_at: string | null;
  daily: { d: string; n: number; nfc: number; qr: number }[];
  by_weekday: { dow: number; n: number }[];
  by_hour: { h: number; n: number }[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_FULL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const PERIODS = [7, 30, 90] as const;

const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/**
 * Analytics do link da plaquinha AirNext Google: quantas pessoas abriram o link
 * (QR Code ou toque NFC) no período, com comparação, gráfico diário, NFC x QR,
 * melhor dia da semana e horário de pico.
 */
export default function GoogleAnalytics({ products }: { products: Product[] }) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [productId, setProductId] = useState<string>('all');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    supabase
      .rpc('google_scan_analytics', { p_days: days, p_product_id: productId === 'all' ? null : productId })
      .then(({ data: res, error }) => {
        if (!alive) return;
        if (error || !res) {
          if (error) console.warn('Analytics Google indisponível (rode sql/12_google_analytics.sql):', error.message);
          setFailed(true);
          setData(null);
        } else {
          setData(res as Analytics);
        }
        setLoading(false);
      });
    return () => { alive = false; };
  }, [days, productId]);

  const stats = useMemo(() => {
    if (!data) return null;
    const total = data.total;
    const prev = data.previous_total;
    const delta = prev > 0 ? Math.round(((total - prev) / prev) * 100) : total > 0 ? null : 0;
    const maxDay = Math.max(1, ...data.daily.map(x => x.n));
    const maxDow = Math.max(1, ...data.by_weekday.map(x => x.n));
    const maxHour = Math.max(1, ...data.by_hour.map(x => x.n));
    const bestDow = total > 0 ? [...data.by_weekday].sort((a, b) => b.n - a.n)[0] : null;
    const bestHour = total > 0 ? [...data.by_hour].sort((a, b) => b.n - a.n)[0] : null;
    const bestDay = total > 0 ? [...data.daily].sort((a, b) => b.n - a.n)[0] : null;
    const nfcPct = total > 0 ? Math.round((data.nfc / total) * 100) : 0;
    return { total, prev, delta, maxDay, maxDow, maxHour, bestDow, bestHour, bestDay, nfcPct, avg: total / data.days };
  }, [data]);

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-amber-400/15 flex items-center justify-center"><BarChart3 className="h-4.5 w-4.5 text-amber-300" /></span>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">Acessos ao seu link</h2>
            <p className="text-[12px] text-zinc-500">Quantas pessoas abriram a avaliação pelo QR Code ou pelo toque NFC.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {products.length > 1 && (
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="bg-white/10 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all" className="text-black">Todas as plaquinhas</option>
              {products.map(p => <option key={p.id} value={p.id} className="text-black">{p.activationCode}</option>)}
            </select>
          )}
          <div className="inline-flex rounded-lg bg-white/5 p-0.5">
            {PERIODS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${days === d ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {d} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-500 text-sm gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando acessos…</div>
      ) : failed || !data || !stats ? (
        <p className="py-10 text-center text-sm text-zinc-500">As estatísticas de acessos não estão disponíveis no momento. Tente novamente mais tarde.</p>
      ) : (
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/[0.04] rounded-xl p-3.5">
              <p className="text-[11px] text-zinc-500">Acessos no período</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.total.toLocaleString('pt-BR')}</p>
              <p className={`text-[11px] mt-1 inline-flex items-center gap-1 ${stats.delta === null || stats.delta > 0 ? 'text-emerald-400' : stats.delta < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                {stats.delta === null ? <><TrendingUp className="h-3 w-3" /> novo</> : stats.delta > 0 ? <><TrendingUp className="h-3 w-3" /> +{stats.delta}%</> : stats.delta < 0 ? <><TrendingDown className="h-3 w-3" /> {stats.delta}%</> : <><Minus className="h-3 w-3" /> igual</>}
                <span className="text-zinc-600">vs. {days} dias anteriores</span>
              </p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3.5">
              <p className="text-[11px] text-zinc-500">Média por dia</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.avg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
              <p className="text-[11px] mt-1 text-zinc-600">{stats.prev.toLocaleString('pt-BR')} no período anterior</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3.5">
              <p className="text-[11px] text-zinc-500">Melhor dia</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.bestDay ? stats.bestDay.n.toLocaleString('pt-BR') : '—'}</p>
              <p className="text-[11px] mt-1 text-zinc-600">{stats.bestDay ? `em ${fmtShort(stats.bestDay.d)}` : 'sem acessos ainda'}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3.5">
              <p className="text-[11px] text-zinc-500">Horário de pico</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.bestHour ? `${String(stats.bestHour.h).padStart(2, '0')}h` : '—'}</p>
              <p className="text-[11px] mt-1 text-zinc-600">{stats.bestDow ? `mais acessos na ${WEEKDAYS_FULL[stats.bestDow.dow]}` : 'sem acessos ainda'}</p>
            </div>
          </div>

          {/* Gráfico diário */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Acessos por dia</p>
            {stats.total === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">Nenhum acesso neste período. Assim que alguém ler o QR Code ou aproximar o celular, aparece aqui.</p>
            ) : (
              <>
                <div className="flex items-end gap-[2px] h-32">
                  {data.daily.map(x => (
                    <div key={x.d} className="flex-1 h-full flex items-end group relative" title={`${fmtShort(x.d)} — ${x.n} acesso${x.n === 1 ? '' : 's'} (NFC ${x.nfc} · QR ${x.qr})`}>
                      <div
                        className="w-full rounded-t-sm bg-amber-400/80 group-hover:bg-amber-300 transition-colors"
                        style={{ height: `${x.n > 0 ? Math.max(6, (x.n / stats.maxDay) * 100) : 2}%`, opacity: x.n > 0 ? 1 : 0.25 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>{fmtShort(data.daily[0].d)}</span>
                  <span>{fmtShort(data.daily[Math.floor(data.daily.length / 2)].d)}</span>
                  <span>{fmtShort(data.daily[data.daily.length - 1].d)}</span>
                </div>
              </>
            )}
          </div>

          {stats.total > 0 && (
            <div className="grid gap-5 lg:grid-cols-3">
              {/* NFC x QR */}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Como acessaram</p>
                <div className="h-2.5 rounded-full overflow-hidden bg-white/10 flex">
                  <div className="h-full bg-amber-400" style={{ width: `${stats.nfcPct}%` }} />
                  <div className="h-full bg-sky-400" style={{ width: `${100 - stats.nfcPct}%` }} />
                </div>
                <div className="mt-2.5 space-y-1.5 text-xs">
                  <p className="flex items-center justify-between text-zinc-300"><span className="inline-flex items-center gap-1.5"><Nfc className="h-3.5 w-3.5 text-amber-400" /> Toque NFC</span><span className="font-semibold">{data.nfc.toLocaleString('pt-BR')}</span></p>
                  <p className="flex items-center justify-between text-zinc-300"><span className="inline-flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5 text-sky-400" /> QR Code</span><span className="font-semibold">{data.qr.toLocaleString('pt-BR')}</span></p>
                </div>
              </div>

              {/* Dia da semana */}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Dia da semana</p>
                <div className="space-y-1">
                  {data.by_weekday.map(x => (
                    <div key={x.dow} className="flex items-center gap-2 text-[11px]">
                      <span className="w-8 text-zinc-500">{WEEKDAYS[x.dow]}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-amber-400/80" style={{ width: `${(x.n / stats.maxDow) * 100}%` }} /></div>
                      <span className="w-7 text-right text-zinc-400">{x.n}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horário */}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Horário do dia</p>
                <div className="flex items-end gap-[2px] h-24">
                  {data.by_hour.map(x => (
                    <div key={x.h} className="flex-1 h-full flex items-end" title={`${String(x.h).padStart(2, '0')}h — ${x.n} acesso${x.n === 1 ? '' : 's'}`}>
                      <div className="w-full rounded-t-sm bg-sky-400/80" style={{ height: `${x.n > 0 ? Math.max(6, (x.n / stats.maxHour) * 100) : 2}%`, opacity: x.n > 0 ? 1 : 0.25 }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
              </div>
            </div>
          )}

          <p className="text-[11px] text-zinc-600">
            {data.last_at ? `Último acesso em ${new Date(data.last_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.` : 'Ainda sem acessos.'} Horários de Brasília. Cada abertura do QR Code ou toque NFC conta um acesso.
          </p>
        </>
      )}
    </div>
  );
}
