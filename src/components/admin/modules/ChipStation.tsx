import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Nfc,
  Printer,
  QrCode,
  Radio,
  ScanLine,
  Search,
  SkipForward,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/admin/ui/Badge';
import { cn, formatDateTime } from '@/lib/adminUtils';
import { QrScanner } from '@/components/QrScanner';
import { findProductByScan, productQrUrl, sortForLabels } from '@/lib/labels';
import { describeNFCError, formatNFCTag, isWebNFCSupported, programNFCTag, readNFCTag } from '@/lib/nfc';
import type { Lot, Product } from '@/types/admin';

// ─── Utilidades ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Produto já tem chip gravado (QR e NFC são dois caminhos para o MESMO produto). */
export const isRecorded = (p: Product) => !!p.programmedAt && p.status !== 'Não programado';

const ACTIVATED = new Set(['Ativado', 'Expirando', 'Expirado', 'Renovado']);

function statusColor(status: string): string {
  if (status === 'Não programado') return 'bg-amber-500/10 text-amber-300';
  if (status === 'Disponível para ativação' || status === 'Programado') return 'bg-sky-500/10 text-sky-300';
  if (ACTIVATED.has(status)) return 'bg-emerald-500/10 text-emerald-300';
  return 'bg-red-500/10 text-red-300';
}

// ─── Ficha completa ──────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  activationCode: 'Código de ativação',
  internalCode: 'Código interno',
  uuid: 'ID público (UUID)',
  id: 'ID do registro',
  status: 'Status',
  programmedAt: 'Chip gravado em',
  programmedBy: 'Gravado por',
  createdAt: 'Criado em',
  updatedAt: 'Atualizado em',
  nfcUrl: 'URL gravada no chip',
};
const FIELD_ORDER = ['internalCode', 'status', 'lotId', 'programmedAt', 'programmedBy', 'createdAt', 'updatedAt', 'nfcUrl', 'uuid', 'id'];
const FIELD_SKIP = new Set(['activationCode']);

const humanize = (key: string) => {
  const t = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function formatFieldValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString('pt-BR');
  }
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

function productRows(product: Product, lotCode: string) {
  const entries = Object.entries(product as unknown as Record<string, unknown>).filter(
    ([k, v]) => !FIELD_SKIP.has(k) && v !== null && v !== undefined && v !== '' && v !== '—'
  );
  const rank = (k: string) => {
    const i = FIELD_ORDER.indexOf(k);
    return i === -1 ? FIELD_ORDER.length : i;
  };
  entries.sort((a, b) => rank(a[0]) - rank(b[0]));
  return entries.map(([k, v]) => ({
    key: k,
    label: k === 'lotId' ? 'Lote' : FIELD_LABELS[k] || humanize(k),
    value: k === 'lotId' ? lotCode || formatFieldValue(v) : formatFieldValue(v),
    mono: k === 'uuid' || k === 'id' || k === 'internalCode' || k === 'nfcUrl',
  }));
}

// ─── Preferências do operador (lembradas no aparelho) ────────────────────────

interface Prefs {
  autoWrite: boolean; // grava assim que o QR é escaneado
  autoPrepare: boolean; // formata o chip antes de gravar
  autoNext: boolean; // reabre o scanner depois de gravar
}
const PREFS_KEY = 'airnext:station-prefs';
const DEFAULT_PREFS: Prefs = { autoWrite: false, autoPrepare: false, autoNext: true };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* sem storage: usa o padrão */ }
  return DEFAULT_PREFS;
}
function savePrefs(p: Prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignora */ }
}

// ─── Componente ──────────────────────────────────────────────────────────────

type Phase = 'idle' | 'preparing' | 'waiting' | 'writing' | 'success' | 'error';

interface SessionItem {
  id: string;
  activationCode: string;
  internalCode: string;
  serial?: string;
  at: string;
  ok: boolean;
}

export interface ChipStationProps {
  products: Product[];
  lots: Lot[];
  appUrl: string;
  /** Lote escolhido nos filtros da aba — usado pelo atalho "Próximo pendente". */
  lotId: string;
  /** Produto em foco (controlado pela aba: vem do scan, da busca ou do atalho "Gravar" de uma etiqueta). */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Registra no banco o resultado da gravação (mesma função do Programador NFC). */
  onProgram: (productId: string, success: boolean, meta?: { serialNumber?: string }) => void | Promise<void>;
  /** Imprime a etiqueta do produto e marca como impressa. */
  onPrintLabel: (product: Product) => void;
  onDownloadQr: (product: Product) => void;
}

export function ChipStation({ products, lots, appUrl, lotId, selectedId, onSelect, onProgram, onPrintLabel, onDownloadQr }: ChipStationProps) {
  const supported = useMemo(() => isWebNFCSupported(), []);
  const product = useMemo(() => products.find((p) => p.id === selectedId) || null, [products, selectedId]);
  const lotCode = product ? lots.find((l) => l.id === product.lotId)?.code || '' : '';

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [lookup, setLookup] = useState('');
  const [lookupMsg, setLookupMsg] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<SessionItem[]>([]);
  const [copied, setCopied] = useState('');
  const [fullOpen, setFullOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [chipInfo, setChipInfo] = useState<{ serial: string; content: string[]; ok: boolean; text: string } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // serial do chip → produto gravado nele (impede gravar o produto seguinte POR CIMA do chip anterior).
  const serialsRef = useRef<Map<string, string>>(new Map());
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const busy = phase === 'preparing' || phase === 'waiting' || phase === 'writing';

  const setPref = (patch: Partial<Prefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('Copie o texto abaixo:', text);
    }
  };

  // Troca de produto limpa o estado da gravação anterior.
  useEffect(() => {
    if (!busyRef.current) {
      setPhase('idle');
      setMessage('');
    }
    setFullOpen(false);
  }, [selectedId]);

  // Quando um produto vem de fora (atalho "Gravar" da etiqueta), traz a estação para a tela.
  useEffect(() => {
    if (selectedId) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId]);

  // ── Gravação ───────────────────────────────────────────────────────────────

  /** Pendentes na ordem das etiquetas, respeitando o lote escolhido na aba. */
  const pending = useMemo(
    () => sortForLabels(products.filter((p) => !isRecorded(p) && p.status === 'Não programado' && (!lotId || p.lotId === lotId))),
    [products, lotId]
  );

  const run = useCallback(
    async (target: Product, opts: { prepare: boolean; skipConfirm?: boolean }) => {
      if (busyRef.current) return;
      if (!supported) {
        setPhase('error');
        setMessage('Gravação indisponível aqui. Abra o painel no Chrome para Android, com NFC ligado e em HTTPS.');
        return;
      }
      if (!target.nfcUrl) {
        setPhase('error');
        setMessage('Este produto não tem URL para gravar. Confira a URL base em Configurações.');
        return;
      }

      if (!opts.skipConfirm) {
        if (target.customerId || ACTIVATED.has(target.status)) {
          if (!window.confirm(`${target.internalCode} (${target.activationCode}) JÁ FOI ATIVADO por um cliente.\n\nRegravar um chip agora só faz sentido para trocar um chip danificado. Continuar?`)) return;
        } else if (isRecorded(target)) {
          if (!window.confirm(`${target.internalCode} (${target.activationCode}) já tem chip gravado.\n\nGravar de novo (por exemplo, para trocar o chip)?`)) return;
        }
      }

      busyRef.current = true;
      try {
        if (opts.prepare) {
          setPhase('preparing');
          setMessage('Aproxime o chip e segure parado — preparando (formatando NDEF)...');
          await formatNFCTag(20000);
          setMessage('Chip preparado. Mantenha-o encostado...');
          await sleep(700);
        }

        // Chips já usados nesta sessão ficam de fora — exceto o do próprio produto (regravação).
        const avoid = new Set<string>();
        serialsRef.current.forEach((pid, serial) => { if (pid !== target.id) avoid.add(serial); });

        setPhase('waiting');
        setMessage('Aproxime o chip NFC da parte de trás do celular...');
        const result = await programNFCTag(target.nfcUrl, {
          avoidSerials: avoid,
          onMessage: (m) => {
            if (!mountedRef.current) return;
            setMessage(m);
            setPhase(m.startsWith('Chip ') ? 'writing' : 'waiting');
          },
        });

        if (result.serialNumber && result.serialNumber !== 'desconhecido') {
          serialsRef.current.set(result.serialNumber, target.id);
        }
        await onProgram(target.id, true, { serialNumber: result.serialNumber });

        if (!mountedRef.current) return;
        setPhase('success');
        setMessage('Chip gravado com sucesso. Pode afastar o chip.');
        setSession((prev) => [
          { id: target.id, activationCode: target.activationCode, internalCode: target.internalCode, serial: result.serialNumber, at: new Date().toISOString(), ok: true },
          ...prev.filter((s) => s.id !== target.id),
        ].slice(0, 30));

        if (prefs.autoNext) {
          await sleep(1400);
          if (mountedRef.current) setScannerOpen(true);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setPhase('error');
        setMessage(describeNFCError(err));
        const msg = (err as Error)?.message;
        const name = (err as { name?: string })?.name;
        // Só falha real entra no histórico; chip que não chegou (timeout) ou cancelamento não é falha do produto.
        if (msg !== 'timeout' && name !== 'AbortError') {
          try { await onProgram(target.id, false, {}); } catch { /* o histórico é só um registro */ }
        }
      } finally {
        busyRef.current = false;
      }
    },
    [supported, onProgram, prefs.autoNext]
  );

  const prepareOnly = async () => {
    if (busyRef.current || !supported) return;
    busyRef.current = true;
    try {
      setPhase('preparing');
      setMessage('Aproxime o chip e segure parado...');
      await formatNFCTag(20000);
      setPhase('idle');
      setMessage('Chip preparado (formatado NDEF). Agora é só gravar.');
    } catch (err) {
      setPhase('error');
      setMessage(describeNFCError(err));
    } finally {
      busyRef.current = false;
    }
  };

  // ── Busca / scan ───────────────────────────────────────────────────────────

  const runLookup = (raw: string) => {
    if (busyRef.current) return;
    const hit = findProductByScan(raw, products);
    if (!hit) {
      setLookupMsg('Nenhuma plaquinha encontrada com esse QR/código.');
      return;
    }
    setLookupMsg('');
    setLookup('');
    onSelect(hit.id);
    // "Gravar ao escanear": já abre o leitor de chip, sem tocar em mais nada.
    if (prefs.autoWrite && supported && !isRecorded(hit)) {
      setTimeout(() => run(hit, { prepare: prefs.autoPrepare }), 250);
    }
  };

  /** Lê o chip encostado (não altera nada): se tiver um link AirNext gravado, abre o produto dele. */
  const readChip = async () => {
    if (busyRef.current || reading) return;
    if (!supported) {
      setChipInfo({ serial: '', content: [], ok: false, text: 'Leitura de chip indisponível aqui. Abra o painel no Chrome para Android, com NFC ligado e em HTTPS.' });
      return;
    }
    busyRef.current = true;
    setReading(true);
    setLookupMsg('');
    setChipInfo({ serial: '', content: [], ok: true, text: 'Aproxime o chip da parte de trás do celular e segure parado...' });
    try {
      const res = await readNFCTag(20000);
      const content = res.records.map((r) => r.data).filter(Boolean);
      let hit: Product | null = null;
      for (const c of content) {
        hit = findProductByScan(c, products);
        if (hit) break;
      }
      if (hit) {
        setChipInfo({ serial: res.serialNumber, content, ok: true, text: `Chip lido: pertence a ${hit.activationCode}.` });
        onSelect(hit.id);
      } else if (content.length === 0) {
        setChipInfo({ serial: res.serialNumber, content, ok: false, text: 'Chip vazio — ainda não foi gravado.' });
      } else {
        setChipInfo({ serial: res.serialNumber, content, ok: false, text: 'O chip tem conteúdo, mas não corresponde a nenhum produto deste painel.' });
      }
    } catch (err) {
      setChipInfo({ serial: '', content: [], ok: false, text: describeNFCError(err) });
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setReading(false);
    }
  };

  const goNextPending = () => {
    const list = pending.filter((p) => p.id !== selectedId);
    if (list.length === 0) {
      setLookupMsg('Nenhuma plaquinha pendente' + (lotId ? ' neste lote.' : '.'));
      return;
    }
    setLookupMsg('');
    onSelect(list[0].id);
  };

  const close = () => {
    if (busy) return;
    onSelect(null);
    setLookup('');
    setLookupMsg('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const publicLink = product ? productQrUrl(product, appUrl) : '';
  const base = (appUrl || window.location.origin).replace(/\/$/, '');
  const recorded = product ? isRecorded(product) : false;
  const rows = product ? productRows(product, lotCode) : [];

  const ghost =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-950/70 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <section ref={panelRef} className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/40 shadow-xl shadow-black/20">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30">
            <Nfc className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Estação de gravação</h2>
            <p className="text-xs text-zinc-500">Escaneie o QR → confira o produto → grave o chip. Tudo aqui.</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium',
            supported ? 'bg-emerald-500/10 text-emerald-300' : 'bg-yellow-500/10 text-yellow-300'
          )}
          title={supported ? undefined : 'A Web NFC só funciona no Chrome para Android, com NFC ligado e em HTTPS.'}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', supported ? 'bg-emerald-400' : 'bg-yellow-400')} />
          {supported ? 'NFC pronto neste aparelho' : 'Gravação NFC indisponível aqui'}
        </span>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {/* Busca / scan */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runLookup(lookup); }}
              placeholder="Cole o link do QR, UUID, código de ativação ou interno..."
              className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => runLookup(lookup)} disabled={busy || reading} className="flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40">
              <Search className="h-4 w-4" /> Buscar
            </button>
            <button
              onClick={readChip}
              disabled={busy || reading}
              title="Encoste um chip para ver a qual produto ele pertence — não altera nada"
              className="flex h-11 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 text-sm font-semibold text-sky-200 hover:bg-sky-500/20 disabled:opacity-40"
            >
              {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />} {reading ? 'Aproxime...' : 'Ler chip'}
            </button>
            <button onClick={() => setScannerOpen(true)} disabled={busy || reading} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-40 sm:flex-none">
              <ScanLine className="h-4 w-4" /> Escanear QR
            </button>
            <button
              onClick={goNextPending}
              disabled={busy}
              title={lotId ? 'Abre a próxima plaquinha sem chip gravado deste lote' : 'Abre a próxima plaquinha sem chip gravado'}
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
            >
              <SkipForward className="h-4 w-4" /> <span className="hidden sm:inline">Próximo pendente</span>
              <span className="rounded-md bg-amber-500/15 px-1.5 text-[11px] text-amber-300">{pending.length}</span>
            </button>
          </div>
        </div>
        {chipInfo && (
          <div className={cn('flex items-start gap-3 rounded-xl border p-3 text-xs', chipInfo.ok ? 'border-sky-500/30 bg-sky-500/5 text-sky-200' : 'border-zinc-800 bg-zinc-950 text-zinc-300')}>
            <Radio className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">{chipInfo.text}</p>
              {chipInfo.serial && <p className="text-zinc-500">Serial: <span className="font-mono text-zinc-300">{chipInfo.serial}</span></p>}
              {chipInfo.content.map((c, i) => <p key={i} className="break-all font-mono text-[11px] text-zinc-400">{c}</p>)}
            </div>
            {!reading && <button onClick={() => setChipInfo(null)} aria-label="Fechar" className="text-zinc-500 hover:text-zinc-200"><X className="h-4 w-4" /></button>}
          </div>
        )}
        {lookupMsg && <p className="rounded-xl bg-zinc-950 p-3 text-xs text-red-300">{lookupMsg}</p>}

        {/* Atalhos automáticos */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'autoWrite', label: 'Gravar assim que escanear', icon: Zap, hint: 'Depois de ler o QR, já abre o leitor de chip. Só para produtos ainda sem chip.' },
            { key: 'autoPrepare', label: 'Preparar chip antes de gravar', icon: Sparkles, hint: 'Formata o chip (NDEF) antes de gravar. Útil para chips novos que dão erro.' },
            { key: 'autoNext', label: 'Escanear o próximo ao terminar', icon: ScanLine, hint: 'Depois de gravar, reabre a câmera para a próxima plaquinha.' },
          ] as const).map((t) => {
            const on = prefs[t.key];
            return (
              <button
                key={t.key}
                type="button"
                role="switch"
                aria-checked={on}
                title={t.hint}
                onClick={() => setPref({ [t.key]: !on })}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  on ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200' : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                )}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Produto em foco */}
        {!product ? (
          <div className="grid gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 sm:grid-cols-3">
            {[
              { n: 1, icon: QrCode, t: 'Escaneie', d: 'Aponte a câmera para o QR da plaquinha ou cole o código.' },
              { n: 2, icon: CheckCircle2, t: 'Confira', d: 'Veja código, lote, status e a URL que vai para o chip.' },
              { n: 3, icon: Nfc, t: 'Grave', d: 'Toque em Gravar chip e encoste o chip no celular.' },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{s.n}. {s.t}</p>
                  <p className="text-xs text-zinc-500">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn('rounded-2xl border p-4 transition-colors sm:p-5', phase === 'success' ? 'border-emerald-500/40 bg-emerald-500/5' : phase === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/50')}>
            <div className="flex flex-col gap-5 sm:flex-row">
              {/* QR + código */}
              <div className="mx-auto flex shrink-0 flex-col items-center gap-2 sm:mx-0">
                <div className="rounded-2xl bg-white p-2.5 shadow-lg">
                  <QRCodeSVG value={publicLink} size={132} level="M" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">QR da etiqueta</p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">Código de ativação</p>
                    <button onClick={() => copy('code', product.activationCode)} title="Copiar código" className="group flex items-center gap-2 text-left">
                      <span className="font-mono text-3xl font-bold tracking-wide text-emerald-300">{product.activationCode}</span>
                      {copied === 'code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300" />}
                    </button>
                  </div>
                  <button onClick={close} disabled={busy} aria-label="Fechar" className="rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-40">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge colorClass={statusColor(product.status)}>{product.status}</Badge>
                  {lotCode && <Badge colorClass="bg-zinc-500/10 text-zinc-400">{lotCode}</Badge>}
                  {product.productLine === 'GOOGLE' && <Badge colorClass="bg-amber-500/10 text-amber-400">Google</Badge>}
                  {recorded ? <Badge colorClass="bg-emerald-500/10 text-emerald-300">Chip gravado</Badge> : <Badge colorClass="bg-amber-500/10 text-amber-300">Chip pendente</Badge>}
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><dt className="text-zinc-600">Interno</dt><dd className="font-mono text-zinc-200">{product.internalCode}</dd></div>
                  <div><dt className="text-zinc-600">Gravado em</dt><dd className="text-zinc-200">{product.programmedAt ? formatDateTime(product.programmedAt) : '—'}</dd></div>
                </dl>

                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">URL que será gravada no chip</p>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-indigo-300">{product.nfcUrl || '— sem URL (confira a URL base em Configurações)'}</p>
                </div>
              </div>
            </div>

            {/* Painel do chip */}
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  {(phase === 'waiting' || phase === 'writing') && <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />}
                  <span
                    className={cn(
                      'relative flex h-11 w-11 items-center justify-center rounded-full ring-1',
                      phase === 'success' ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40'
                        : phase === 'error' ? 'bg-red-500/15 text-red-300 ring-red-500/40'
                        : busy ? 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/40'
                        : 'bg-zinc-900 text-zinc-500 ring-zinc-800'
                    )}
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : phase === 'success' ? <CheckCircle2 className="h-5 w-5" /> : phase === 'error' ? <TriangleAlert className="h-5 w-5" /> : <Radio className="h-5 w-5" />}
                  </span>
                </div>
                <div className="min-w-0 flex-1" aria-live="polite">
                  <p className={cn('text-sm font-semibold', phase === 'success' ? 'text-emerald-300' : phase === 'error' ? 'text-red-300' : 'text-zinc-200')}>
                    {phase === 'idle' && (message ? 'Chip' : recorded ? 'Chip já gravado' : 'Pronto para gravar')}
                    {phase === 'preparing' && 'Preparando o chip…'}
                    {phase === 'waiting' && 'Aguardando o chip…'}
                    {phase === 'writing' && 'Gravando — não afaste!'}
                    {phase === 'success' && 'Gravado com sucesso'}
                    {phase === 'error' && 'Não foi possível gravar'}
                  </p>
                  <p className="break-words text-xs text-zinc-500">
                    {message || (supported ? 'Toque em “Gravar chip” e encoste o chip na parte de trás do celular.' : 'Abra este painel no Chrome para Android para gravar.')}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                <button
                  onClick={() => run(product, { prepare: prefs.autoPrepare })}
                  disabled={busy || !supported || !product.nfcUrl}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Nfc className="h-5 w-5" />}
                  {busy ? 'Gravando…' : recorded || phase === 'success' ? 'Regravar chip' : 'Gravar chip'}
                </button>
                <button
                  onClick={() => run(product, { prepare: true })}
                  disabled={busy || !supported || !product.nfcUrl}
                  title="Formata o chip e já grava em seguida — para chips novos ou que deram erro"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" /> Preparar + gravar
                </button>
                <button
                  onClick={prepareOnly}
                  disabled={busy || !supported}
                  title="Só formata o chip (apaga o conteúdo), sem gravar"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Só preparar
                </button>
              </div>

              {phase === 'success' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setScannerOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600">
                    <ScanLine className="h-4 w-4" /> Escanear próxima
                  </button>
                  <button onClick={goNextPending} className={ghost}><SkipForward className="h-4 w-4" /> Próximo pendente</button>
                  <button onClick={() => onPrintLabel(product)} className={ghost}><Printer className="h-4 w-4" /> Imprimir etiqueta</button>
                </div>
              )}
            </div>

            {/* Atalhos do produto */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onPrintLabel(product)} className={ghost}><Printer className="h-3.5 w-3.5" /> Imprimir etiqueta</button>
              <button onClick={() => copy('msg', `Seu código de ativação AirNext: ${product.activationCode}\nPara ativar, acesse: ${base}/ativar/${product.activationCode}`)} className={ghost}>
                <Copy className="h-3.5 w-3.5" /> {copied === 'msg' ? 'Copiado!' : 'Mensagem pro cliente'}
              </button>
              <button onClick={() => copy('link', publicLink)} className={ghost}><Copy className="h-3.5 w-3.5" /> {copied === 'link' ? 'Copiado!' : 'Link do QR'}</button>
              <button onClick={() => copy('url', product.nfcUrl)} disabled={!product.nfcUrl} className={ghost}><Copy className="h-3.5 w-3.5" /> {copied === 'url' ? 'Copiado!' : 'URL do chip'}</button>
              <a href={publicLink} target="_blank" rel="noopener noreferrer" className={ghost}><ExternalLink className="h-3.5 w-3.5" /> Página pública</a>
              <button onClick={() => onDownloadQr(product)} className={ghost}><Download className="h-3.5 w-3.5" /> QR (PNG)</button>
            </div>

            {/* Ficha completa */}
            <button onClick={() => setFullOpen((v) => !v)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200">
              Ficha completa do produto
              <ChevronDown className={cn('h-4 w-4 transition-transform', fullOpen && 'rotate-180')} />
            </button>
            {fullOpen && (
              <dl className="mt-2 grid gap-x-6 gap-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:grid-cols-2">
                {rows.map((r) => (
                  <div key={r.key} className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">{r.label}</dt>
                    <dd className={cn('break-words text-sm text-zinc-200', r.mono && 'font-mono text-xs')}>{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {/* Gravados nesta sessão */}
        {session.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              <span>Gravados nesta sessão</span>
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300">{session.length}</span>
            </p>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {session.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  title={`${s.internalCode} · ${formatDateTime(s.at)}${s.serial ? ` · chip ${s.serial}` : ''}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 font-mono text-[11px] text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Check className="h-3 w-3" /> {s.activationCode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <QrScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(raw) => {
          setScannerOpen(false);
          runLookup(raw);
        }}
      />
    </section>
  );
}
