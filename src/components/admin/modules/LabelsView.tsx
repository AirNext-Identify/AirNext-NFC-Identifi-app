import { useEffect, useMemo, useState } from 'react';
import { Printer, CheckCircle, RotateCcw, Copy, Download, Check, Nfc, CheckSquare, Square, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn } from '@/lib/adminUtils';
import { ChipStation, isRecorded } from '@/components/admin/modules/ChipStation';
import {
  DEFAULT_LABEL_OPTIONS,
  downloadCodeList,
  downloadLabels,
  downloadQrPng,
  downloadQrZip,
  printCodeList,
  loadPrinted,
  getPrintedRemoteError,
  loadPrintedRemote,
  printLabels,
  productQrUrl,
  savePrinted,
  setPrintedRemote,
  sortForLabels,
  type LabelMode,
} from '@/lib/labels';
import type { QrStickersApi } from '@/hooks/useQrStickers';
import type { Lot, Product } from '@/types/admin';

interface LabelsViewProps {
  products: Product[];
  lots: Lot[];
  appUrl: string;
  /** QR Codes marcados como adesivo (página Adesivos QR). */
  stickers: QrStickersApi;
  /** Registra a gravação do chip no banco (mesma função do Programador NFC). */
  onProgram: (productId: string, success: boolean, meta?: { serialNumber?: string }) => void | Promise<void>;
}

type StatusFilter = 'all' | 'recorded' | 'pending';

const PREVIEW_LIMIT = 60;

const MODES: { id: LabelMode; label: string; hint: string }[] = [
  { id: 'qr-code', label: 'QR + código', hint: 'Recomendado: o código sai impresso junto do QR.' },
  { id: 'qr', label: 'Só QR', hint: 'Apenas o QR Code.' },
  { id: 'code', label: 'Só código', hint: 'Para colar na plaquinha, na mesma ordem das folhas de QR.' },
];

export function LabelsView({ products, lots, appUrl, stickers, onProgram }: LabelsViewProps) {
  const { byProduct: stickerBy } = stickers;
  const [stickerMsg, setStickerMsg] = useState<string | null>(null);
  const [lotId, setLotId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [onlyUnprinted, setOnlyUnprinted] = useState(true);
  const [search, setSearch] = useState('');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  // Seleção manual de QR Codes para baixar (independente de "tirar da impressão").
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selBusy, setSelBusy] = useState(false);
  const [printed, setPrinted] = useState<Set<string>>(() => loadPrinted());
  const [mode, setMode] = useState<LabelMode>(DEFAULT_LABEL_OPTIONS.mode);
  const [qrCm, setQrCm] = useState(DEFAULT_LABEL_OPTIONS.qrCm);
  const [cols, setCols] = useState(DEFAULT_LABEL_OPTIONS.cols);
  const [showInternal, setShowInternal] = useState(DEFAULT_LABEL_OPTIONS.showInternal);

  const [stationId, setStationId] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [qrBusy, setQrBusy] = useState(false);
  // Etiquetas que acabaram de sair para impressão/download e aguardam o "sim, imprimi".
  const [pendingMark, setPendingMark] = useState<Product[] | null>(null);
  const [syncWarn, setSyncWarn] = useState(false);

  // Junta o que está salvo no banco com o que só existia neste navegador (e envia o
  // que faltava para o banco), para PC e celular passarem a mostrar o mesmo marcador.
  useEffect(() => {
    let alive = true;
    (async () => {
      const remote = await loadPrintedRemote();
      if (!alive) return;
      if (!remote) { setSyncWarn(true); return; }
      const local = loadPrinted();
      const merged = new Set<string>([...remote, ...local]);
      const onlyLocal = [...local].filter((id) => !remote.has(id));
      if (onlyLocal.length > 0) void setPrintedRemote(onlyLocal, true);
      setPrinted(merged);
      savePrinted(merged);
    })();
    return () => { alive = false; };
  }, []);

  const applyPrinted = async (ids: string[], value: boolean) => {
    setPrinted((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
      savePrinted(next);
      return next;
    });
    const ok = await setPrintedRemote(ids, value);
    setSyncWarn(!ok);
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

  // Selecionados, na ordem das etiquetas. Continuam selecionados mesmo se o filtro mudar.
  const selectedProducts = useMemo(() => sortForLabels(products.filter((p) => selected.has(p.id))), [products, selected]);
  const selectedHidden = selectedProducts.length - visible.filter((p) => selected.has(p.id)).length;
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAllVisible = () => setSelected((prev) => new Set([...prev, ...visible.map((p) => p.id)]));
  const unselectAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((p) => next.delete(p.id));
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  const flashSticker = (text: string) => { setStickerMsg(text); window.setTimeout(() => setStickerMsg(null), 5000); };
  /** Marca/desmarca um QR como adesivo (botão “Adesivo” do cartão). */
  const toggleSticker = async (p: Product) => {
    const err = stickerBy.has(p.id) ? await stickers.unmark([p.id]) : await stickers.mark([p.id]);
    if (err) flashSticker(`Não foi possível salvar o adesivo: ${err}`);
  };
  const markSelectedAsStickers = async () => {
    const ids = selectedProducts.filter((p) => !stickerBy.has(p.id)).map((p) => p.id);
    if (ids.length === 0) { flashSticker('Os selecionados já estão na lista de adesivos.'); return; }
    const err = await stickers.mark(ids);
    flashSticker(err ? `Não foi possível salvar os adesivos: ${err}` : `${ids.length} QR marcado(s) como adesivo — veja em Adesivos QR.`);
  };
  /** Quem é adesivo e foi baixado aqui passa a constar como “baixado” na página Adesivos QR. */
  const recordDownloaded = (list: Product[]) => {
    const ids = list.filter((p) => stickerBy.has(p.id)).map((p) => p.id);
    if (ids.length > 0) void stickers.markDownloaded(ids);
  };

  const handleDownloadSelected = async () => {
    if (selectedProducts.length === 0 || selBusy) return;
    setSelBusy(true);
    try {
      if (selectedProducts.length === 1) await downloadQrPng(selectedProducts[0], appUrl);
      else await downloadQrZip(selectedProducts, appUrl, `${sheetTitle}-selecionados`);
      recordDownloaded(selectedProducts);
    } catch {
      window.alert('Não foi possível gerar os QR Codes selecionados. Tente novamente.');
    } finally {
      setSelBusy(false);
    }
  };

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
    // Em vez de um window.confirm (que some/é bloqueado atrás da janela de impressão,
    // principalmente no celular), mostra uma barra fixa na tela para confirmar.
    setPendingMark([...toPrint]);
  };

  const confirmMark = async () => {
    if (!pendingMark) return;
    const ids = pendingMark.map((p) => p.id);
    setPendingMark(null);
    setExcluded(new Set());
    await applyPrinted(ids, true);
  };

  const handleDownloadLabels = () => {
    if (toPrint.length === 0) return;
    downloadLabels(toPrint, { baseUrl: appUrl, mode, qrCm, cols, showInternal, sheetTitle });
    setPendingMark([...toPrint]);
  };

  const handleDownloadQrs = async () => {
    if (toPrint.length === 0 || qrBusy) return;
    setQrBusy(true);
    try {
      await downloadQrZip(toPrint, appUrl, sheetTitle);
      recordDownloaded(toPrint);
      setPendingMark([...toPrint]);
    } catch {
      window.alert('Não foi possível gerar os QR Codes. Tente novamente.');
    } finally {
      setQrBusy(false);
    }
  };

  const handleDownloadQr = async (p: Product) => {
    try {
      await downloadQrPng(p, appUrl);
      recordDownloaded([p]);
    } catch {
      window.alert('Não foi possível baixar o QR Code.');
    }
  };

  /** Imprime a etiqueta de um produto só (atalho da estação) e marca como impressa. */
  const handlePrintOne = (p: Product) => {
    printLabels([p], { baseUrl: appUrl, mode, qrCm, cols, showInternal, sheetTitle: lotCodeOf(p) ? `Lote ${lotCodeOf(p)}` : undefined });
    void applyPrinted([p.id], true);
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
    void applyPrinted(scope.map((p) => p.id), false);
  };

  /** Marca/desmarca uma etiqueta na mão (clique no ✓ do cartão). */
  const togglePrinted = (p: Product) => void applyPrinted([p.id], !printed.has(p.id));

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'recorded', label: 'Chip gravado' },
    { id: 'pending', label: 'Pendentes de gravação' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Estação: escanear → conferir → gravar chip, tudo na mesma aba */}
      <ChipStation
        products={products}
        lots={lots}
        appUrl={appUrl}
        lotId={lotId}
        selectedId={stationId}
        onSelect={setStationId}
        onProgram={onProgram}
        onPrintLabel={handlePrintOne}
        onDownloadQr={handleDownloadQr}
      />

      {pendingMark && (
        <div className="sticky top-2 z-20 flex flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-zinc-950/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-200">
            Você imprimiu/baixou <strong className="text-emerald-300">{pendingMark.length}</strong> etiqueta(s)? Marque como impressas para saírem da lista &quot;falta imprimir&quot;.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPendingMark(null)} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800">Ainda não</button>
            <button onClick={confirmMark} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              <CheckCircle className="h-4 w-4" /> Marcar como impressas
            </button>
          </div>
        </div>
      )}

      {syncWarn && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Não consegui salvar o marcador no banco, então ele está valendo só neste navegador.
          {getPrintedRemoteError() && <> Erro do Supabase: <code>{getPrintedRemoteError()}</code></>}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
        <Printer className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
        <div>
          <p className="text-sm font-medium text-indigo-200">Imprima por lote, não um por um</p>
          <p className="mt-1 text-xs text-indigo-300/80">
            Escolha o lote e imprima a folha inteira: cada etiqueta sai com o <strong>QR e o código juntos</strong>, numerada e
            sempre na mesma ordem (por código interno). Para gravar o chip de qualquer etiqueta, toque em <strong>Gravar</strong> no
            cartão dela — a estação acima já abre com o produto certo.
          </p>
        </div>
      </div>

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

      {stickerMsg && (
        <div role="status" className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-200">{stickerMsg}</div>
      )}
      {stickers.error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Para guardar os adesivos, rode o script <strong>sql/25_adesivos_qr.sql</strong> no Supabase. <code>{stickers.error}</code>
        </div>
      )}

      {/* Seleção de QR Codes para download */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-300">
          <span className="font-semibold text-sky-300">{selectedProducts.length}</span> QR Code(s) selecionado(s) para download
          {selectedHidden > 0 && <span className="ml-2 text-xs text-zinc-500">({selectedHidden} fora do filtro atual)</span>}
          <p className="mt-0.5 text-xs text-zinc-500">Marque a caixinha “Baixar” em cada cartão abaixo, ou use “Selecionar todos”.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={allVisibleSelected ? unselectAllVisible : selectAllVisible}
            disabled={visible.length === 0}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allVisibleSelected ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            {allVisibleSelected ? `Desmarcar os ${visible.length}` : `Selecionar todos (${visible.length})`}
          </button>
          {selectedProducts.length > 0 && (
            <button onClick={clearSelection} className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              <RotateCcw className="h-4 w-4" /> Limpar seleção
            </button>
          )}
          <button
            onClick={markSelectedAsStickers}
            disabled={selectedProducts.length === 0}
            title="Guarda os selecionados na página Adesivos QR para você saber depois quais já foram baixados"
            className="flex items-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Tag className="h-4 w-4" /> Marcar como adesivo
          </button>
          <button
            onClick={handleDownloadSelected}
            disabled={selectedProducts.length === 0 || selBusy}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {selBusy ? 'Gerando…' : selectedProducts.length === 1 ? 'Baixar QR Code (PNG)' : `Baixar ${selectedProducts.length} selecionado(s) (ZIP)`}
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
                  className={cn('relative w-full rounded-2xl border p-3 pb-[4.25rem] text-center transition-all', off ? 'border-zinc-800 bg-zinc-950 opacity-40' : 'border-zinc-800 bg-zinc-900 hover:border-indigo-500/50', selected.has(p.id) && 'ring-2 ring-sky-400')}
                >
                  <span className="absolute left-2 top-1.5 text-[10px] text-zinc-500">{i + 1}</span>
                  
                  {mode !== 'code' && (
                    <div className="mx-auto mt-3 w-fit rounded-lg bg-white p-1.5">
                      <QRCodeSVG value={productQrUrl(p, appUrl)} size={64} level="M" />
                    </div>
                  )}
                  {mode !== 'qr' && <p className="mt-2 font-mono text-sm font-bold text-emerald-300">{p.activationCode}</p>}
                  {showInternal && p.internalCode !== '—' && <p className="text-[11px] text-zinc-500">{p.internalCode}</p>}
                </button>
                <button
                  onClick={() => setStationId(p.id)}
                  title={isRecorded(p) ? 'Abrir na estação (chip já gravado)' : 'Gravar o chip deste produto'}
                  className={cn(
                    'absolute left-1/2 top-1.5 -translate-x-1/2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    isRecorded(p) ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  )}
                >
                  <Nfc className="h-3 w-3" /> {isRecorded(p) ? 'Gravado' : 'Gravar'}
                </button>
                <button
                  onClick={() => togglePrinted(p)}
                  title={printed.has(p.id) ? 'Impressa — clique para desmarcar' : 'Marcar como impressa'}
                  className={cn(
                    'absolute right-1.5 top-1 rounded-full p-1',
                    printed.has(p.id) ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
                  )}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleSticker(p)}
                  title={stickerBy.has(p.id)
                    ? (stickerBy.get(p.id)?.downloaded_at ? 'Adesivo já baixado — clique para tirar da lista de adesivos' : 'Adesivo (falta baixar) — clique para tirar da lista')
                    : 'Marcar este QR como adesivo (vai para a página Adesivos QR)'}
                  className={cn(
                    'absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition',
                    stickerBy.has(p.id)
                      ? (stickerBy.get(p.id)?.downloaded_at
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-indigo-400 bg-indigo-500/20 text-indigo-200')
                      : 'border-zinc-700 bg-zinc-950/90 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  <Tag className="h-3 w-3" />
                  {stickerBy.has(p.id) ? (stickerBy.get(p.id)?.downloaded_at ? 'Adesivo · baixado' : 'Adesivo') : 'Adesivo'}
                </button>
                <label
                  title="Selecionar este QR Code para download"
                  className={cn(
                    'absolute bottom-1.5 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1 rounded-lg border px-1.5 py-1 text-[10px] font-semibold',
                    selected.has(p.id) ? 'border-sky-400 bg-sky-500/20 text-sky-200' : 'border-zinc-700 bg-zinc-950/90 text-zinc-400 hover:bg-zinc-800'
                  )}
                >
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelected(p.id)} className="h-3.5 w-3.5 accent-sky-500" />
                  Baixar
                </label>
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
              Mostrando {PREVIEW_LIMIT} de {visible.length} na tela — todas as {toPrint.length} entram na impressão. Para baixar QR Codes além dos {PREVIEW_LIMIT} da tela, use “Selecionar todos”.
            </p>
          )}
        </>
      )}
    </div>
  );
}
