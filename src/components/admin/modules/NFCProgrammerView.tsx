import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  CheckCircle,
  AlertCircle,
  Zap,
  Boxes,
  Radio,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Smartphone,
  ClipboardList,
  Link2,
  Trash2,
  Printer,
  Copy,
} from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Modal } from '@/components/admin/ui/Modal';
import { cn, formatDateTime } from '@/lib/adminUtils';
import { isWebNFCSupported, programNFCTag, readNFCTag, formatNFCTag, describeNFCError, getNFCDiagnostics, type NFCReadResult } from '@/lib/nfc';
import { DEFAULT_LABEL_OPTIONS, loadPrinted, printLabels, savePrinted } from '@/lib/labels';
import type { Lot, Product, NFCProgrammingRecord } from '@/types/admin';

interface NFCProgrammerViewProps {
  products: Product[];
  lots: Lot[];
  nfcRecords: NFCProgrammingRecord[];
  onProgram: (productId: string, success: boolean, meta?: { serialNumber?: string }) => void | Promise<void>;
  /** Apaga os dados de gravação de um produto (volta para "Não programado"). */
  onResetProduct?: (productId: string) => Promise<boolean>;
  /** Apaga o histórico de gravações que falharam. */
  onClearFailed?: () => Promise<boolean>;
  /** Lote vindo do atalho "Gravar chips" na tela de Lotes — já entra selecionado. */
  preselectedLotId?: string | null;
  /** Avisa a tela pai que o atalho já foi consumido (evita reaplicar em toda renderização). */
  onLotConsumed?: () => void;
  /** Produto vindo de um atalho "Gravar chip" individual (ex.: tela de Produtos) — já entra buscado/selecionado. */
  preselectedProductId?: string | null;
  onProductConsumed?: () => void;
  /** URL base gravada nos chips/QR Codes — editável direto por aqui, sem precisar ir em Configurações. */
  appUrl: string;
  onUpdateAppUrl: (url: string) => void | Promise<void>;
}

type ScanStatus = 'idle' | 'waiting' | 'writing' | 'verifying' | 'success' | 'error';

export function NFCProgrammerView({ products, lots, nfcRecords, onProgram, onResetProduct, onClearFailed, preselectedLotId, onLotConsumed, preselectedProductId, onProductConsumed, appUrl, onUpdateAppUrl }: NFCProgrammerViewProps) {
  const [mode, setMode] = useState<'single' | 'continuous' | 'manual'>('single');
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastResult, setLastResult] = useState<{ product: Product; success: boolean; serialNumber?: string } | null>(null);
  const [continuousRunning, setContinuousRunning] = useState(false);
  const [pausedProduct, setPausedProduct] = useState<Product | null>(null);
  const [recordedModalOpen, setRecordedModalOpen] = useState(false);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  const cancelRef = useRef(false);
  // Seriais dos chips já gravados e validados nesta sessão: impede gravar o
  // produto seguinte POR CIMA do chip anterior (que ainda está encostado).
  const writtenSerialsRef = useRef<Set<string>>(new Set());
  const supported = useMemo(() => isWebNFCSupported(), []);

  // Atalho "Gravar chips" vindo de Lotes: já chega com o lote selecionado e
  // no modo contínuo, pronto pra apertar "Iniciar".
  useEffect(() => {
    if (preselectedLotId) {
      setSelectedLot(preselectedLotId);
      setMode('continuous');
      onLotConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedLotId]);

  // Atalho "Gravar chip" vindo de um produto específico (ex.: tela de
  // Produtos): já chega com a busca preenchida no modo único, pronto para
  // localizar o chip certo sem precisar digitar nada.
  useEffect(() => {
    if (preselectedProductId) {
      const product = products.find((p) => p.id === preselectedProductId);
      if (product) {
        setMode('single');
        setSearch(product.internalCode !== '—' ? product.internalCode : product.uuid);
      }
      onProductConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedProductId]);

  // "Disponível pra gravar" = produto ainda não programado no chip.
  // 'Não programado' é o status real que vem do banco assim que um produto
  // ou lote é criado (ver useAdminData.ts / mapDbStatusToUi). O status
  // 'Não ativado' nunca é atribuído no fluxo atual — era resíduo de uma
  // versão antiga do filtro, e por causa dele lotes recém-criados não
  // apareciam aqui pra gravação.
  const availableProducts = useMemo(() => {
    // Também entram os produtos liberados via QR Code que ainda NÃO tiveram o
    // chip gravado: QR e NFC são dois caminhos para o MESMO produto, e liberar
    // por QR não pode impedir a gravação do chip depois.
    return products.filter(
      (p) => p.status === 'Não programado' || (p.status === 'Disponível para ativação' && !p.programmedAt)
    );
  }, [products]);

  // Produtos já gravados no chip (qualquer status além de "Não programado")
  // — usados para o contador e para a janela "Produtos gravados". Ordenados
  // do mais recente para o mais antigo, pela data de programação.
  const recordedProducts = useMemo(() => {
    return products
      .filter((p) => p.status !== 'Não programado' && !!p.programmedAt)
      .sort((a, b) => (b.programmedAt || '').localeCompare(a.programmedAt || ''));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchesSearch =
        p.uuid.toLowerCase().includes(search.toLowerCase()) ||
        p.activationCode.toLowerCase().includes(search.toLowerCase()) ||
        p.internalCode.toLowerCase().includes(search.toLowerCase());
      const matchesLot = !selectedLot || p.lotId === selectedLot;
      return matchesSearch && matchesLot;
    });
  }, [availableProducts, search, selectedLot]);

  const continuousQueue = useMemo(() => {
    if (!selectedLot) return [];
    return availableProducts.filter((p) => p.lotId === selectedLot);
  }, [availableProducts, selectedLot]);

  /** Executa a gravação real via Web NFC. Nunca simula. Sucesso = o Chrome confirmou o write(). */
  const runProgramCycle = useCallback(
    async (product: Product): Promise<{ success: boolean; serialNumber?: string }> => {
      setActiveProduct(product);

      if (!supported) {
        // Sem Web NFC (desktop, iOS, outro navegador): bloqueia de verdade e não grava nada no banco.
        setStatus('error');
        setStatusMessage('Gravação real indisponível neste dispositivo/navegador. Abra o painel no Chrome para Android com NFC habilitado.');
        return { success: false };
      }

      try {
        setStatus('waiting');
        setStatusMessage('Aproxime o chip NFC do dispositivo...');
        const result = await programWithStages(product.nfcUrl, setStatus, setStatusMessage, writtenSerialsRef.current);
        if (result.serialNumber && result.serialNumber !== 'desconhecido') {
          writtenSerialsRef.current.add(result.serialNumber);
        }
        setStatus('success');
        setStatusMessage('Chip gravado com sucesso. Pode afastar o chip.');
        return { success: true, serialNumber: result.serialNumber };
      } catch (err) {
        setStatus('error');
        setStatusMessage(describeNFCError(err));
        return { success: false };
      }
    },
    [supported]
  );

  // ─── Modo contínuo: grava um chip, registra no banco e segue para o próximo.
  // Se uma gravação falhar, o ciclo PARA e espera o operador escolher entre
  // "Tentar novamente" ou "Pular este chip".
  //
  // A fila é um SNAPSHOT local (capturado ao iniciar) percorrido por índice,
  // para não depender da lista reativa `products`, que muda a cada gravação.
  const queueRef = useRef<Product[]>([]);
  const queueIndexRef = useRef(0);

  const processAt = async (index: number) => {
    const queue = queueRef.current;
    if (index >= queue.length) {
      setContinuousRunning(false);
      setStatus('idle');
      setPausedProduct(null);
      return;
    }
    const product = queue[index];
    const result = await runProgramCycle(product);
    if (supported) {
      await onProgram(product.id, result.success, { serialNumber: result.serialNumber });
    }
    setLastResult({ product, success: result.success, serialNumber: result.serialNumber });

    if (!result.success) {
      // Falhou: interrompe e aguarda decisão do operador.
      setContinuousRunning(false);
      setPausedProduct(product);
      queueIndexRef.current = index;
      return;
    }

    setPausedProduct(null);
    queueIndexRef.current = index + 1;
    await delay(1200);
    if (cancelRef.current) return;
    await processAt(index + 1);
  };

  const startContinuous = async () => {
    if (continuousQueue.length === 0) return;
    cancelRef.current = false;
    queueRef.current = [...continuousQueue];
    queueIndexRef.current = 0;
    setContinuousRunning(true);
    setPausedProduct(null);
    await processAt(0);
  };

  const retryPaused = async () => {
    if (!pausedProduct) return;
    setContinuousRunning(true);
    await processAt(queueIndexRef.current);
  };

  const skipPaused = async () => {
    // Pulo explícito e consciente do operador — o chip pausado continua
    // "Não programado" (não é marcado como pronto sozinho); o operador
    // decide avançar manualmente para o próximo item da fila.
    setPausedProduct(null);
    setContinuousRunning(true);
    await processAt(queueIndexRef.current + 1);
  };

  const programSingle = async (product: Product) => {
    if (status === 'waiting' || status === 'writing' || status === 'verifying') return;
    const result = await runProgramCycle(product);
    if (supported) {
      await onProgram(product.id, result.success, { serialNumber: result.serialNumber });
    }
    setLastResult({ product, success: result.success, serialNumber: result.serialNumber });
  };

  const stopContinuous = () => {
    cancelRef.current = true;
    setContinuousRunning(false);
    setStatus('idle');
    setStatusMessage('');
    setPausedProduct(null);
  };

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const isBusy = status === 'waiting' || status === 'writing' || status === 'verifying';

  const failedCount = useMemo(() => nfcRecords.filter((r) => r.status === 'Falha').length, [nfcRecords]);

  const handleResetProduct = async (product: Product) => {
    if (!onResetProduct) return;
    const ok = window.confirm(
      `Apagar os dados de gravação de ${product.internalCode} (${product.activationCode})?\n\nO produto volta para "Não programado" e o histórico dele é removido. O chip físico não é alterado — será regravado na próxima gravação.`
    );
    if (!ok) return;
    const done = await onResetProduct(product.id);
    if (done) {
      // Libera os chips da sessão para poder reaproveitar o mesmo chip na regravação.
      writtenSerialsRef.current.clear();
      if (lastResult?.product.id === product.id) setLastResult(null);
    }
  };

  const handleClearFailed = async () => {
    if (!onClearFailed || failedCount === 0) return;
    if (!window.confirm(`Apagar ${failedCount} registro(s) de gravação com falha do histórico? Os produtos não são alterados.`)) return;
    await onClearFailed();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SupportBanner supported={supported} />
      <ChipReaderCard supported={supported} />

      {/* Barra de resumo + atalhos: contador de gravados/pendentes, janela com
          os produtos já gravados (código, lote, data) e edição rápida da URL
          gravada nos chips — sem precisar sair desta tela. */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">{recordedProducts.length}</span>
            <span className="text-xs text-emerald-400/80">gravados</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2">
            <Radio className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{availableProducts.length}</span>
            <span className="text-xs text-amber-400/80">pendentes de gravação</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRecordedModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            <ClipboardList className="h-4 w-4" /> Ver produtos gravados
          </button>
          {onClearFailed && (
            <button
              onClick={handleClearFailed}
              disabled={failedCount === 0}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" /> Limpar falhas ({failedCount})
            </button>
          )}
          <button
            onClick={() => setUrlEditorOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            <Link2 className="h-4 w-4" /> Editar URL de gravação
          </button>
        </div>
      </div>


      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:flex">
          <button
            onClick={() => { setMode('single'); stopContinuous(); }}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              mode === 'single' ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
            )}
          >
            <Cpu className="h-4 w-4" /> Programação única
          </button>
          <button
            onClick={() => setMode('continuous')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              mode === 'continuous' ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
            )}
          >
            <Zap className="h-4 w-4" /> Modo contínuo
          </button>
          <button
            onClick={() => { setMode('manual'); stopContinuous(); }}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
              mode === 'manual' ? 'bg-indigo-500 text-white' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
            )}
          >
            <Smartphone className="h-4 w-4" /> Manual (NFC Tools)
          </button>
        </div>
      </div>

      {mode === 'manual' && (
        <ManualWriteCard
          queue={continuousQueue}
          lots={lots}
          selectedLot={selectedLot}
          onSelectLot={setSelectedLot}
          onProgram={onProgram}
        />
      )}

      {mode === 'manual' ? null : mode === 'single' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar produto por UUID, código ou código interno..." className="sm:max-w-md" />
            <select value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none sm:w-auto">
              <option value="">Todos os lotes</option>
              {lots.map((l) => <option key={l.id} value={l.id}>{l.code}{l.productLine === 'GOOGLE' ? ' · Google' : ''}</option>)}
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState title="Nenhum produto disponível" description="Selecione um lote ou busque um produto para programar." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.slice(0, 9).map((p) => {
                const isActive = activeProduct?.id === p.id && isBusy;
                return (
                  <div key={p.id} className={cn('rounded-2xl border p-4 transition-all', isActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">{p.internalCode}</p>
                        <p className="truncate text-xs text-zinc-500">{p.uuid}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge colorClass="bg-zinc-500/10 text-zinc-400">{lots.find((l) => l.id === p.lotId)?.code}</Badge>
                        {p.productLine === 'GOOGLE' && <Badge colorClass="bg-amber-500/10 text-amber-400">Google</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 truncate text-xs text-zinc-500">{p.nfcUrl}</p>
                    <button
                      onClick={() => programSingle(p)}
                      disabled={isBusy || !supported}
                      title={!supported ? 'Abra este painel no Chrome para Android com NFC habilitado para gravar de verdade.' : undefined}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
                    >
                      {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                      {isActive ? 'Gravando...' : !supported ? 'Gravação indisponível' : 'Ler e gravar NFC'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <Boxes className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="text-lg font-semibold text-zinc-200">Modo contínuo</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Selecione um lote e aproxime os chips um a um. O sistema lê, grava a URL, valida e passa
            automaticamente para o próximo produto — sem precisar clicar entre uma gravação e outra.
          </p>
          <select
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
            disabled={continuousRunning || !!pausedProduct}
            className="mx-auto mt-4 block h-10 w-full max-w-xs rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none disabled:opacity-50"
          >
            <option value="">Selecione um lote</option>
            {lots.map((l) => <option key={l.id} value={l.id}>{l.code}{l.productLine === 'GOOGLE' ? ' · Google' : ''} ({l.availableQuantity} disp.)</option>)}
          </select>

          {selectedLot && continuousQueue.length > 0 && (
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {!continuousRunning && !pausedProduct ? (
                <button
                  onClick={startContinuous}
                  disabled={!supported}
                  title={!supported ? 'Abra este painel no Chrome para Android com NFC habilitado para gravar de verdade.' : undefined}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" /> {supported ? `Iniciar (${continuousQueue.length} restantes)` : 'Gravação indisponível'}
                </button>
              ) : (
                <button onClick={stopContinuous} className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-2 text-sm font-semibold text-white hover:bg-red-600">
                  Parar modo contínuo
                </button>
              )}
            </div>
          )}
          {selectedLot && continuousQueue.length === 0 && !pausedProduct && (
            <p className="mt-4 text-sm text-zinc-500">Nenhum produto disponível neste lote.</p>
          )}
        </div>
      )}

      {/* Pausa: a gravação falhou. O fluxo não avança sozinho — o operador tenta de novo ou pula este item. */}
      {pausedProduct && (
        <div className="flex flex-col gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <p className="text-sm font-semibold text-yellow-300">Falha na gravação — o fluxo está pausado</p>
              <p className="mt-0.5 text-xs text-yellow-400/80">
                O chip de <strong>{pausedProduct.internalCode}</strong> não pôde ser gravado. Aproxime o mesmo chip
                novamente e tente de novo, ou pule para o próximo.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={retryPaused}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              <Radio className="h-4 w-4" /> Tentar novamente
            </button>
            <button
              onClick={skipPaused}
              disabled={isBusy}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              Pular este chip
            </button>
          </div>
        </div>
      )}

      {(isBusy || (mode === 'continuous' && continuousRunning)) && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          <div>
            <p className="text-sm font-medium text-indigo-200">{activeProduct?.internalCode}</p>
            <p className="text-xs text-indigo-300/70">{statusMessage}</p>
          </div>
        </div>
      )}

      {lastResult && !isBusy && (
        <div className={cn('rounded-2xl border p-4', lastResult.success ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10')}>
          <div className="flex items-start gap-3">
            {lastResult.success ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', lastResult.success ? 'text-emerald-400' : 'text-red-400')}>
                {lastResult.success ? 'Gravado com sucesso' : 'Falha na gravação'}
              </p>
              {lastResult.success && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-950 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Código deste produto</span>
                  <span className="font-mono text-base font-bold text-emerald-300">{lastResult.product.activationCode}</span>
                </div>
              )}
              {!lastResult.success && statusMessage && (
                <p className="mt-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs text-red-300">Motivo: {statusMessage}</p>
              )}
              <p className="mt-2 truncate text-xs text-zinc-400">{lastResult.product.internalCode} • {lastResult.product.uuid}</p>
              <p className="text-xs text-zinc-500">{formatDateTime(new Date().toISOString())}</p>
              {lastResult.success && (
                <button
                  onClick={() => {
                    printLabels([lastResult.product], { ...DEFAULT_LABEL_OPTIONS, baseUrl: appUrl });
                    const printed = loadPrinted();
                    printed.add(lastResult.product.id);
                    savePrinted(printed);
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir etiqueta (QR + código)
                </button>
              )}
              {lastResult.success && (
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Produto liberado para ativação — já saiu da lista de pendentes
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-200">Últimas programações</h3>
        </div>
        {nfcRecords.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Nenhuma programação registrada.</p>
        ) : (
          <>
            {/* Tabela para telas médias e maiores */}
            <div className="hidden max-h-64 overflow-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-2">Produto</th>
                    <th className="px-4 py-2">UUID</th>
                    <th className="px-4 py-2">Operador</th>
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {nfcRecords.slice(0, 10).map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-2 text-zinc-300">{products.find((p) => p.id === r.productId)?.internalCode || r.productId}</td>
                      <td className="px-4 py-2 text-xs text-zinc-500">{r.uuid.slice(0, 16)}...</td>
                      <td className="px-4 py-2 text-zinc-400">{r.programmedBy}</td>
                      <td className="px-4 py-2 text-zinc-400">{formatDateTime(r.programmedAt)}</td>
                      <td className="px-4 py-2">
                        <Badge colorClass={r.status === 'Sucesso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards para telas pequenas */}
            <div className="max-h-64 divide-y divide-zinc-800 overflow-auto md:hidden">
              {nfcRecords.slice(0, 10).map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">{products.find((p) => p.id === r.productId)?.internalCode || r.productId}</p>
                    <Badge colorClass={r.status === 'Sucesso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}>{r.status}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-500">{r.uuid}</p>
                  <p className="mt-1 text-xs text-zinc-500">{r.programmedBy} • {formatDateTime(r.programmedAt)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <RecordedProductsModal
        isOpen={recordedModalOpen}
        onClose={() => setRecordedModalOpen(false)}
        recordedProducts={recordedProducts}
        lots={lots}
        lastProductId={lastResult?.product.id}
        onResetProduct={onResetProduct ? handleResetProduct : undefined}
      />
      <UrlEditorModal
        isOpen={urlEditorOpen}
        onClose={() => setUrlEditorOpen(false)}
        appUrl={appUrl}
        onUpdateAppUrl={onUpdateAppUrl}
      />
    </div>
  );
}

function SupportBanner({ supported }: { supported: boolean }) {
  if (supported) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <Radio className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-300">Leitor NFC ativo neste dispositivo</p>
          <p className="text-xs text-emerald-400/70">
            Aproxime o chip do celular: o sistema detecta o chip e grava a URL única do produto. Ao terminar, o produto sai da lista de pendentes.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
      <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
      <div>
        <p className="text-sm font-medium text-yellow-300">Leitura/gravação NFC real indisponível neste dispositivo</p>
        <p className="text-xs text-yellow-400/70">
          A Web NFC API funciona apenas no Google Chrome para Android com NFC habilitado, via HTTPS. Abra este painel em um
          smartphone Android compatível para gravar os chips fisicamente. Aqui a gravação fica bloqueada — nenhum dado falso é
          criado no painel.
        </p>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Executa a gravação real (detecta o chip → grava) reportando os estágios na UI. */
async function programWithStages(
  url: string,
  setStatus: (s: ScanStatus) => void,
  setMessage: (m: string) => void,
  avoidSerials: Set<string>
) {
  setStatus('waiting');
  return programNFCTag(url, {
    avoidSerials,
    onMessage: (m) => {
      setMessage(m);
      setStatus(m.startsWith('Chip ') ? 'writing' : 'waiting');
    },
  });
}

/**
 * Janela ("Produtos gravados") com todos os produtos já programados no
 * chip: código de ativação, código interno, lote e informações da
 * gravação (data, operador, serial do chip, se foi validado por
 * releitura). O produto gravado por último fica destacado no topo, bem
 * separado dos que ainda serão gravados (esses nem aparecem aqui).
 */
function RecordedProductsModal({
  isOpen,
  onClose,
  recordedProducts,
  lots,
  lastProductId,
  onResetProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  recordedProducts: Product[];
  lots: Lot[];
  lastProductId?: string;
  onResetProduct?: (product: Product) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return recordedProducts.filter(
      (p) =>
        p.activationCode.toLowerCase().includes(term) ||
        p.internalCode.toLowerCase().includes(term) ||
        p.uuid.toLowerCase().includes(term)
    );
  }, [recordedProducts, search]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Produtos gravados"
      description={`${recordedProducts.length} produto(s) já gravado(s) no chip — cada um mostra código, lote e dados da gravação.`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por código de ativação, código interno ou UUID..." />

        {filtered.length === 0 ? (
          <EmptyState title="Nenhum produto gravado" description="Assim que um chip for gravado e validado, ele aparece aqui." />
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((p) => {
              const isLast = p.id === lastProductId;
              const lotCode = lots.find((l) => l.id === p.lotId)?.code;
              return (
                <div
                  key={p.id}
                  className={cn(
                    'rounded-2xl border p-4',
                    isLast ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'border-zinc-800 bg-zinc-950'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-100">{p.activationCode}</span>
                      {isLast && <Badge colorClass="bg-emerald-500/15 text-emerald-300">Gravado agora</Badge>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.productLine === 'GOOGLE' && <Badge colorClass="bg-amber-500/10 text-amber-400">Google</Badge>}
                      <Badge colorClass="bg-zinc-500/10 text-zinc-400">{lotCode || 'Sem lote'}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-500 sm:grid-cols-4">
                    <span>Interno: <span className="text-zinc-300">{p.internalCode}</span></span>
                    <span>Status: <span className="text-zinc-300">{p.status}</span></span>
                    <span>Gravado em: <span className="text-zinc-300">{formatDateTime(p.programmedAt)}</span></span>
                    <span>Por: <span className="text-zinc-300">{p.programmedBy || '—'}</span></span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[11px] text-zinc-600">{p.uuid}</p>
                    {onResetProduct && (
                      p.status === 'Disponível para ativação' ? (
                        <button
                          onClick={() => onResetProduct(p)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" /> Apagar dados
                        </button>
                      ) : (
                        <span className="shrink-0 text-[10px] text-zinc-600">Ativado — não pode apagar</span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Atalho para editar a URL base gravada nos chips NFC/QR Codes sem sair do
 * Programador NFC. Reaproveita o mesmo `onUpdateAppUrl` já usado em
 * Configurações — é o mesmo valor em toda a aplicação (fonte única).
 */
function UrlEditorModal({
  isOpen,
  onClose,
  appUrl,
  onUpdateAppUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
  onUpdateAppUrl: (url: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState(appUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setValue(appUrl);
  }, [isOpen, appUrl]);

  const handleSave = async () => {
    setSaving(true);
    await onUpdateAppUrl(value);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="URL de gravação dos chips"
      description="Todo chip gravado a partir de agora usa esta URL como base (ex.: https://seu-dominio.com/n/UUID). Altere aqui se precisar trocar de domínio no futuro."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">URL base</label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://airnext.com.br"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
          Exemplo de link final gravado num chip: <span className="font-mono text-zinc-300">{(value || appUrl).replace(/\/$/, '')}/n/&lt;uuid-do-produto&gt;</span>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Salvar URL
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Leitor de teste: encosta um chip e mostra serial + conteúdo, sem gravar nada. */
function ChipReaderCard({ supported }: { supported: boolean }) {
  const [state, setState] = useState<'idle' | 'reading' | 'done' | 'error'>('idle');
  const [info, setInfo] = useState<NFCReadResult | null>(null);
  const [error, setError] = useState('');
  const [diag, setDiag] = useState<{ label: string; ok: boolean; detail: string }[] | null>(null);

  const runDiag = async () => setDiag(await getNFCDiagnostics());

  const [prep, setPrep] = useState<{ busy: boolean; ok?: boolean; msg: string }>({ busy: false, msg: '' });
  const prepare = async () => {
    setPrep({ busy: true, msg: 'Aproxime o chip e segure parado...' });
    try {
      await formatNFCTag(20000);
      setPrep({ busy: false, ok: true, msg: 'Chip preparado (formatado NDEF). Agora ele pode ser lido e gravado.' });
    } catch (err) {
      setPrep({ busy: false, ok: false, msg: describeNFCError(err) });
    }
  };

  const read = async () => {
    setState('reading');
    setError('');
    setInfo(null);
    try {
      const result = await readNFCTag(20000);
      setInfo(result);
      setState('done');
    } catch (err) {
      setError(describeNFCError(err));
      setState('error');
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-200">Leitor de chip (teste)</p>
          <p className="text-xs text-zinc-500">Encosta um chip para ver o serial e o que está gravado nele. Não altera nada.</p>
        </div>
        <button
          onClick={prepare}
          disabled={!supported || prep.busy}
          title="Formata chips novos/em branco (apaga o conteúdo do chip)"
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {prep.busy ? 'Aproxime o chip...' : 'Preparar chip'}
        </button>
        <button
          onClick={runDiag}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          Diagnóstico
        </button>
        <button
          onClick={read}
          disabled={!supported || state === 'reading'}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {state === 'reading' ? 'Aproxime o chip...' : 'Ler chip'}
        </button>
      </div>
      {state === 'done' && info && (
        <div className="mt-3 space-y-1 rounded-xl bg-zinc-950 p-3 text-xs text-zinc-300">
          <p>Serial: <span className="font-mono text-emerald-300">{info.serialNumber}</span></p>
          {info.records.length === 0 ? (
            <p className="text-zinc-500">Chip vazio (sem registros NDEF).</p>
          ) : (
            info.records.map((r, i) => (
              <p key={i} className="break-all">
                <span className="text-zinc-500">{r.recordType}:</span> {r.data || '(vazio)'}
              </p>
            ))
          )}
        </div>
      )}
      {state === 'error' && <p className="mt-3 rounded-xl bg-zinc-950 p-3 text-xs text-red-300">{error}</p>}
      {prep.msg && (
        <p className={cn('mt-3 rounded-xl bg-zinc-950 p-3 text-xs', prep.ok === false ? 'text-red-300' : prep.ok ? 'text-emerald-300' : 'text-zinc-300')}>{prep.msg}</p>
      )}
      {diag && (
        <div className="mt-3 space-y-1 rounded-xl bg-zinc-950 p-3 text-xs">
          {diag.map((d) => (
            <p key={d.label} className={d.ok ? 'text-emerald-300' : 'text-red-300'}>
              {d.ok ? '✓' : '✗'} {d.label}: <span className="text-zinc-400">{d.detail}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Gravação manual: para chips que o Chrome não consegue gravar (ex.: ISO 14443-4) mas que o
 * app NFC Tools grava. Mostra UM produto por vez: copiar URL → colar/gravar no NFC Tools →
 * "Já gravei" (marca como programado e já copia a URL do próximo).
 */
function ManualWriteCard({
  queue,
  lots,
  selectedLot,
  onSelectLot,
  onProgram,
}: {
  queue: Product[];
  lots: Lot[];
  selectedLot: string;
  onSelectLot: (id: string) => void;
  onProgram: NFCProgrammerViewProps['onProgram'];
}) {
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastDone, setLastDone] = useState('');
  const [doneCount, setDoneCount] = useState(0);

  const ordered = useMemo(() => {
    const sorted = [...queue].sort((a, b) => (a.internalCode || '').localeCompare(b.internalCode || '', 'pt-BR', { numeric: true }));
    return [...sorted.filter((p) => !skipped.has(p.id)), ...sorted.filter((p) => skipped.has(p.id))];
  }, [queue, skipped]);

  const current = ordered[0];
  const next = ordered[1];

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copie a URL abaixo:', text);
    }
  };

  const confirmDone = async () => {
    if (!current || busy) return;
    // Copia a URL do próximo já no clique (o navegador só libera a área de transferência em um toque).
    if (next?.nfcUrl) copyText(next.nfcUrl);
    setBusy(true);
    try {
      await onProgram(current.id, true, {});
      setLastDone(current.internalCode !== '—' ? current.internalCode : current.uuid);
      setDoneCount((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const skip = () => {
    if (!current) return;
    setSkipped((prev) => new Set(prev).add(current.id));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-200">Gravação manual (app NFC Tools)</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Para chips que o Chrome não grava. No NFC Tools: <strong>Gravar → Adicionar registro → URL</strong>, cole a URL, toque em
          <strong> Gravar</strong> e encoste o chip. Depois volte aqui e toque em <strong>Já gravei</strong> — o produto sai da
          lista e a URL do próximo já fica copiada.
        </p>
      </div>

      <select value={selectedLot} onChange={(e) => onSelectLot(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none sm:w-auto">
        <option value="">Selecione um lote</option>
        {lots.map((l) => <option key={l.id} value={l.id}>{l.code}{l.productLine === 'GOOGLE' ? ' · Google' : ''}</option>)}
      </select>

      {!selectedLot ? (
        <p className="rounded-xl bg-zinc-950 p-3 text-xs text-zinc-400">Escolha um lote para começar pela ordem do código interno.</p>
      ) : !current ? (
        <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">Nenhum chip pendente neste lote. Tudo gravado!</p>
      ) : (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span>Faltam <strong className="text-zinc-200">{ordered.length}</strong> neste lote{doneCount > 0 ? ` · ${doneCount} marcado(s) agora` : ''}</span>
            {lastDone && <span>Último: {lastDone}</span>}
          </div>

          <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500">Chip da vez</p>
          <p className="text-2xl font-bold text-zinc-100">{current.internalCode}</p>
          <p className="mt-2 break-all rounded-xl bg-zinc-950 p-3 font-mono text-xs text-emerald-300">{current.nfcUrl || 'Produto sem URL (confira a URL base)'}</p>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={() => current.nfcUrl && copyText(current.nfcUrl)}
              disabled={!current.nfcUrl}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" /> {copied ? 'Copiado!' : 'Copiar URL'}
            </button>
            <button
              onClick={confirmDone}
              disabled={busy || !current.nfcUrl}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Já gravei
            </button>
            <button onClick={skip} className="rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">
              Pular este
            </button>
          </div>
          <p className="mt-3 text-[11px] text-zinc-500">
            Só toque em "Já gravei" depois que o NFC Tools mostrar que gravou. Dica: no NFC Tools, em Ler, confira se o chip mostra a URL certa.
          </p>
        </div>
      )}
    </div>
  );
}
