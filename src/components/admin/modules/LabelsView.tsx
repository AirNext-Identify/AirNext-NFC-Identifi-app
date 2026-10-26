import { useMemo, useState } from 'react';
import { Printer, CheckCircle, RotateCcw, ScanLine, Copy, Search, Download, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn } from '@/lib/adminUtils';
import { QrScanner } from '@/components/QrScanner';
import {
  DEFAULT_LABEL_OPTIONS,
  downloadCodeList,
  downloadLabels,
  downloadQrPng,
  downloadQrZip,
  findProductByScan,
  printCodeList,
  loadPrinted,
  printLabels,
  productQrUrl,
  savePrinted,
  sortForLabels,
  type LabelMode,
} from '@/lib/labels';
import type { Lot, Product } from '@/types/admin';

interface LabelsViewProps {
  products: Product[];
  lots: Lot[];
  appUrl: string;
}

type StatusFilter = 'all' | 'recorded' | 'pending';

const PREVIEW_LIMIT = 60;

const MODES: { id: LabelMode; label: string; hint: string }[] = [
  { id: 'qr-code', label: 'QR + código', hint: 'Recomendado: o código sai impresso junto do QR.' },
  { id: 'qr', label: 'Só QR', hint: 'Apenas o QR Code.' },
  { id: 'code', label: 'Só código', hint: 'Para colar na plaquinha, na mesma ordem das folhas de QR.' },
];

// ─── Ficha detalhada do produto (só no painel admin) ─────────────────────────
const FIELD_LABELS: Record<string, string> = {
  activationCode: 'Código de ativação',
  internalCode: 'Código interno',
  uuid: 'ID público (UUID)',
  id: 'ID do registro',
  status: 'Status',
  programmedAt: 'Chip gravado em',
  createdAt: 'Criado em',
  updatedAt: 'Atualizado em',
};

/** Campos mostrados primeiro, nessa ordem; o resto vem logo depois. */
const FIELD_ORDER = ['internalCode', 'status', 'lotId', 'programmedAt', 'createdAt', 'updatedAt', 'uuid', 'id'];
/** O código de ativação já aparece em destaque no topo da ficha. */
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

function productRows(product: Product, lotCode: string): { key: string; label: string; value: string; mono: boolean }[] {
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
    mono: k === 'uuid' || k === 'id' || k === 'internalCode',
  }));
}

interface ProductDetailsProps {
  product: Product;
  lotCode: string;
  appUrl: string;
  copied: string;
  onCopy: (key: string, text: string) => void;
  onDownloadQr: () => void;
  onClose: () => void;
}

function ProductDetails({ product, lotCode, appUrl, copied, onCopy, onDownloadQr, onClose }: ProductDetailsProps) {
  const base = (appUrl || window.location.origin).replace(/\/$/, '');
  const publicLink = productQrUrl(product, appUrl);
  const rows = productRows(product, lotCode);
  const btn = 'flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800';

  return (
    <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Código de ativação</p>
          <p className="font-mono text-2xl font-bold text-emerald-300">{product.activationCode}</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800">
          Fechar
        </button>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.key} className="min-w-0">
            <dt className="text-[10px] uppercase tracking-widest text-zinc-500">{r.label}</dt>
            <dd className={cn('break-words text-sm text-zinc-200', r.mono && 'font-mono text-xs')}>{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onCopy('code', product.activationCode)} className={btn}>
          <Copy className="h-3.5 w-3.5" /> {copied === 'code' ? 'Copiado!' : 'Copiar código'}
        </button>
        <button
          onClick={() => onCopy('msg', `Seu código de ativação AirNext: ${product.activationCode}\nPara ativar, acesse: ${base}/ativar/${product.activationCode}`)}
          className={btn}
        >
          <Copy className="h-3.5 w-3.5" /> {copied === 'msg' ? 'Copiado!' : 'Copiar mensagem pro cliente'}
        </button>
        <button onClick={() => onCopy('link', publicLink)} className={btn}>
          <Copy className="h-3.5 w-3.5" /> {copied === 'link' ? 'Copiado!' : 'Copiar link do QR'}
        </button>
        <a href={publicLink} target="_blank" rel="noopener noreferrer" className={btn}>
          <ExternalLink className="h-3.5 w-3.5" /> Abrir página pública
        </a>
        <button onClick={onDownloadQr} className={btn}>
          <Download className="h-3.5 w-3.5" /> Baixar QR (PNG)
        </button>
      </div>
    </div>
  );
}

export function LabelsView({ products, lots, appUrl }: LabelsViewProps) {
  const [lotId, setLotId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [onlyUnprinted, setOnlyUnprinted] = useState(true);
  const [search, setSearch] = useState('');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [printed, setPrinted] = useState<Set<string>>(() => loadPrinted());
  const [mode, setMode] = useState<LabelMode>(DEFAULT_LABEL_OPTIONS.mode);
  const [qrCm, setQrCm] = useState(DEFAULT_LABEL_OPTIONS.qrCm);
  const [cols, setCols] = useState(DEFAULT_LABEL_OPTIONS.cols);
  const [showInternal, setShowInternal] = useState(DEFAULT_LABEL_OPTIONS.showInternal);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookup, setLookup] = useState('');
  const [found, setFound] = useState<Product | null>(null);
  const [lookupMsg, setLookupMsg] = useState('');
  const [copied, setCopied] = useState('');
  const [qrBusy, setQrBusy] = useState(false);

  const runLookup = (raw: string) => {
    const hit = findProductByScan(raw, products);
    setFound(hit);
    setLookupMsg(hit ? '' : 'Nenhuma plaquinha encontrada com esse QR/código.');
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('Copie o texto abaixo:', text);
    }
  };

  const isRecorded = (p: Product) => !!p.programmedAt && p.status !== 'Não programado';

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (lotId && p.lotId !== lotId) return false;
      if (status === 'recorded' && !isRecorded(p)) return false;
      if (status === 'pending' && isRecorded(p)) return false;
      if (onlyUnprinted && printed.has(p.id)) return false;
      if (term) {
        return (
          p.activationCode.toLowerCase().includes(term) ||
          p.internalCode.toLowerCase().includes(term) ||
          p.uuid.toLowerCase().includes(term)
        );
      }
      return true;
    });
    return sortForLabels(list);
  }, [products, lotId, status, onlyUnprinted, search, printed]);

  const toPrint = useMemo(() => visible.filter((p) => !excluded.has(p.id)), [visible, excluded]);
  const lotCode = lots.find((l) => l.id === lotId)?.code;
  const printedInScope = useMemo(
    () => products.filter((p) => (!lotId || p.lotId === lotId) && printed.has(p.id)).length,
    [products, lotId, printed]
  );

  const toggleExcluded = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sheetTitle = lotCode ? `Lote ${lotCode}` : 'Todos os lotes';
  const lotCodeOf = (p: Product) => lots.find((l) => l.id === p.lotId)?.code || '';

  const handlePrint = () => {
    if (toPrint.length === 0) return;
    printLabels(toPrint, { baseUrl: appUrl, mode, qrCm, cols, showInternal, sheetTitle });
    // Pergunta depois que a janela de impressão abre, para o operador confirmar que imprimiu de fato.
    setTimeout(() => {
      if (window.confirm(`Marcar ${toPrint.length} etiqueta(s) como impressas? Elas saem da lista "falta imprimir".`)) {
        const next = new Set(printed);
        toPrint.forEach((p) => next.add(p.id));
        setPrinted(next);
        savePrinted(next);
        setExcluded(new Set());
      }
    }, 1500);
  };

  const handleDownloadLabels = () => {
    if (toPrint.length === 0) return;
    downloadLabels(toPrint, { baseUrl: appUrl, mode, qrCm, cols, showInternal, sheetTitle });
  };

  const handleDownloadQrs = async () => {
    if (toPrint.length === 0 || qrBusy) return;
    setQrBusy(true);
    try {
      await downloadQrZip(toPrint, appUrl, sheetTitle);
    } catch {
      window.alert('Não foi possível gerar os QR Codes. Tente novamente.');
    } finally {
      setQrBusy(false);
    }
  };

  const handleDownloadQr = async (p: Product) => {
    try {
      await downloadQrPng(p, appUrl);
    } catch {
      window.alert('Não foi possível baixar o QR Code.');
    }
  };

  const handleCopyAllCodes = () => {
    if (toPrint.length === 0) return;
    copy('all', toPrint.map((p) => p.activationCode).join('\n'));
  };

  const handleDownloadCodes = () => {
    if (toPrint.length === 0) return;
    downloadCodeList(toPrint, sheetTitle, lotCodeOf);
  };

  const resetPrinted = () => {
    const scope = products.filter((p) => !lotId || p.lotId === lotId);
    if (!window.confirm(`Desmarcar ${printedInScope} etiqueta(s) como impressas${lotCode ? ` do lote ${lotCode}` : ''}?`)) return;
    const next = new Set(printed);
    scope.forEach((p) => next.delete(p.id));
    setPrinted(next);
    savePrinted(next);
  };

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'recorded', label: 'Chip gravado' },
    { id: 'pending', label: 'Pendentes de gravação' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Como funciona */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
        <p className="text-sm font-medium text-indigo-200">Imprima por lote, não um por um</p>
        <p className="mt-1 text-xs text-indigo-300/80">
          Escolha o lote e imprima a folha inteira: cada etiqueta sai com o <strong>QR e o código juntos</strong>, numerada e
          sempre na mesma ordem (por código interno). Se precisar de um código separado para a plaquinha, imprima também no
          modo "Só código" — a ordem é a mesma, então não precisa procurar.
        </p>
      </div>

      {/* Identificar plaquinha: lê o QR (ou cola o link/código) e mostra o código de ativação */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm font-semibold text-zinc-200">Identificar uma plaquinha</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Escaneie o QR da plaquinha (ou cole o link/código) para ver todas as informações do produto. Esses detalhes aparecem só aqui, no painel admin — quem escaneia fora do painel vê apenas a página pública.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runLookup(lookup); }}
            placeholder="Cole o link do QR, UUID, código de ativação ou interno..."
            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button onClick={() => runLookup(lookup)} className="flex h-10 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" /> Buscar
            </button>
            <button onClick={() => setScannerOpen(true)} className="flex h-10 items-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-600">
              <ScanLine className="h-4 w-4" /> Escanear QR
            </button>
          </div>
        </div>
        {lookupMsg && <p className="mt-3 rounded-xl bg-zinc-950 p-3 text-xs text-red-300">{lookupMsg}</p>}
        {found && (
          <ProductDetails
            product={found}
            lotCode={lots.find((l) => l.id === found.lotId)?.code || ''}
            appUrl={appUrl}
            copied={copied}
            onCopy={copy}
            onDownloadQr={() => handleDownloadQr(found)}
            onClose={() => { setFound(null); setLookup(''); }}
          />
        )}
      </div>
      <QrScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(raw) => {
          setScannerOpen(false);
          setLookup(raw);
          runLookup(raw);
        }}
      />

      {/* Filtros */}
      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select value={lotId} onChange={(e) => { setLotId(e.target.value); setExcluded(new Set()); }} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none sm:w-auto">
            <option value="">Todos os lotes</option>
            {lots.map((l) => (
              <option key={l.id} value={l.id}>{l.code}{l.productLine === 'GOOGLE' ? ' · Google' : ''}</option>
            ))}
          </select>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por código de ativação, código interno ou UUID..." className="sm:max-w-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id)}
              className={cn('rounded-xl px-3 py-1.5 text-xs font-medium', status === t.id ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800')}
            >
              {t.label}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={onlyUnprinted} onChange={(e) => setOnlyUnprinted(e.target.checked)} className="h-4 w-4 accent-indigo-500" />
            Mostrar só o que falta imprimir
          </label>
        </div>
      </div>

      {/* Layout da folha */}
      <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Conteúdo da etiqueta</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={cn('rounded-xl px-3 py-2 text-xs font-medium', mode === m.id ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800')}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500">{MODES.find((m) => m.id === mode)?.hint}</p>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Tamanho do QR</p>
          <select value={qrCm} onChange={(e) => setQrCm(Number(e.target.value))} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none">
            {[1.5, 2, 2.5, 3, 4].map((n) => <option key={n} value={n}>{n} cm</option>)}
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Colunas por folha</p>
          <select value={cols} onChange={(e) => setCols(Number(e.target.value))} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none">
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} colunas</option>)}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300 sm:col-span-2 lg:col-span-4">
          <input type="checkbox" checked={showInternal} onChange={(e) => setShowInternal(e.target.checked)} className="h-4 w-4 accent-indigo-500" />
          Mostrar também o código interno (ex.: AN-0001) em letra pequena
        </label>
      </div>

      {/* Barra de ação */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-300">
          <span className="font-semibold text-emerald-300">{toPrint.length}</span> etiqueta(s) para imprimir
          {excluded.size > 0 && <span className="text-zinc-500"> · {excluded.size} desmarcada(s)</span>}
          <span className="ml-2 text-xs text-zinc-500">{printedInScope} já impressa(s){lotCode ? ` no lote ${lotCode}` : ''}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {printedInScope > 0 && (
            <button onClick={resetPrinted} className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              <RotateCcw className="h-4 w-4" /> Desmarcar impressas
            </button>
          )}
          <button
            onClick={() => printCodeList(toPrint, sheetTitle, lotCodeOf)}
            disabled={toPrint.length === 0}
            title="Folha com Nº, código interno e código de ativação de cada plaquinha"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> Imprimir lista de códigos
          </button>
          <button
            onClick={handleCopyAllCodes}
            disabled={toPrint.length === 0}
            title="Copia os códigos de ativação das etiquetas selecionadas, um por linha, na ordem das etiquetas"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied === 'all' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied === 'all' ? 'Copiados!' : 'Copiar códigos'}
          </button>
          <button
            onClick={handleDownloadCodes}
            disabled={toPrint.length === 0}
            title="Baixa a lista de códigos em CSV (abre no Excel), na mesma ordem das etiquetas"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Baixar lista de códigos
          </button>
          <button
            onClick={handleDownloadQrs}
            disabled={toPrint.length === 0 || qrBusy}
            title="Baixa um ZIP com o QR Code (PNG) de cada plaquinha selecionada"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {qrBusy ? 'Gerando QR Codes...' : 'Baixar QR Codes (ZIP)'}
          </button>
          <button
            onClick={handleDownloadLabels}
            disabled={toPrint.length === 0}
            title="Baixa a folha de etiquetas (A4) em arquivo — abra e imprima ou salve como PDF"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Baixar {toPrint.length} etiqueta(s)
          </button>
          <button
            onClick={handlePrint}
            disabled={toPrint.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> Imprimir {toPrint.length} etiqueta(s)
          </button>
        </div>
      </div>

      {/* Pré-visualização */}
      {visible.length === 0 ? (
        <EmptyState title="Nenhuma etiqueta para imprimir" description={'Escolha um lote ou desmarque "Mostrar só o que falta imprimir" para ver todas.'} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {visible.slice(0, PREVIEW_LIMIT).map((p, i) => {
              const off = excluded.has(p.id);
              return (
                <div key={p.id} className="relative">
                <button
                  onClick={() => toggleExcluded(p.id)}
                  title={off ? 'Clique para incluir na impressão' : 'Clique para tirar da impressão'}
                  className={cn('relative w-full rounded-2xl border p-3 text-center transition-all', off ? 'border-zinc-800 bg-zinc-950 opacity-40' : 'border-zinc-800 bg-zinc-900 hover:border-indigo-500/50')}
                >
                  <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500">{i + 1}</span>
                  {printed.has(p.id) && <CheckCircle className="absolute right-2 top-1.5 h-3.5 w-3.5 text-emerald-400" />}
                  {mode !== 'code' && (
                    <div className="mx-auto mt-3 w-fit rounded-lg bg-white p-1.5">
                      <QRCodeSVG value={productQrUrl(p, appUrl)} size={64} level="M" />
                    </div>
                  )}
                  {mode !== 'qr' && <p className="mt-2 font-mono text-sm font-bold text-emerald-300">{p.activationCode}</p>}
                  {showInternal && p.internalCode !== '—' && <p className="text-[11px] text-zinc-500">{p.internalCode}</p>}
                </button>
                <button
                  onClick={() => copy(`card-${p.id}`, p.activationCode)}
                  title="Copiar código de ativação"
                  className="absolute bottom-1.5 left-1.5 rounded-lg border border-zinc-700 bg-zinc-950/90 p-1.5 text-zinc-300 hover:bg-zinc-800"
                >
                  {copied === `card-${p.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDownloadQr(p)}
                  title="Baixar QR Code (PNG)"
                  className="absolute bottom-1.5 right-1.5 rounded-lg border border-zinc-700 bg-zinc-950/90 p-1.5 text-zinc-300 hover:bg-zinc-800"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                </div>
              );
            })}
          </div>
          {visible.length > PREVIEW_LIMIT && (
            <p className="text-center text-xs text-zinc-500">
              Mostrando {PREVIEW_LIMIT} de {visible.length} na tela — todas as {toPrint.length} selecionadas entram na impressão.
            </p>
          )}
        </>
      )}
    </div>
  );
}
