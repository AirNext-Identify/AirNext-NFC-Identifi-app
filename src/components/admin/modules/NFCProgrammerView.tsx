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
} from 'lucide-react';
import { SearchBar } from '@/components/admin/ui/SearchBar';
import { Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Modal } from '@/components/admin/ui/Modal';
import { cn, formatDateTime } from '@/lib/adminUtils';
import { isWebNFCSupported, writeAndVerifyNFCTag, describeNFCError } from '@/lib/nfc';
import type { Lot, Product, NFCProgrammingRecord } from '@/types/admin';

interface NFCProgrammerViewProps {
  products: Product[];
  lots: Lot[];
  nfcRecords: NFCProgrammingRecord[];
  onProgram: (productId: string, success: boolean, meta?: { serialNumber?: string; verified?: boolean }) => void;
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

export function NFCProgrammerView({ products, lots, nfcRecords, onProgram, preselectedLotId, onLotConsumed, preselectedProductId, onProductConsumed, appUrl, onUpdateAppUrl }: NFCProgrammerViewProps) {
  const [mode, setMode] = useState<'single' | 'continuous'>('single');
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState<string>('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastResult, setLastResult] = useState<{ product: Product; success: boolean; serialNumber?: string; verified?: boolean } | null>(null);
  const [continuousRunning, setContinuousRunning] = useState(false);
  const [pausedProduct, setPausedProduct] = useState<Product | null>(null);
  const [recordedModalOpen, setRecordedModalOpen] = useState(false);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  const cancelRef = useRef(false);
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
    return products.filter((p) => p.status === 'Não programado');
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

  /** Executa o ciclo real de gravação via Web NFC. Nunca simula. */
  const runProgramCycle = useCallback(
    async (product: Product): Promise<{ success: boolean; serialNumber?: string; verified?: boolean }> => {
      setActiveProduct(product);

      if (!supported) {
        // Ambiente sem suporte a Web NFC (ex.: desktop, iOS, navegador que
        // não seja Chrome/Android): NÃO simula gravação. Bloqueia de verdade
        // e não grava nada no banco — antes disso o código sorteava sucesso
        // aleatoriamente e poluía o painel com dados falsos (prefixo SIM-).
        setStatus('error');
        setStatusMessage('Gravação real indisponível neste dispositivo/navegador. Abra o painel no Chrome para Android com NFC habilitado.');
        return { success: false };
      }

      try {
        setStatus('waiting');
        setStatusMessage('Aproxime o chip NFC do dispositivo...');
        const result = await writeAndVerifyNFCTagWithStages(product.nfcUrl, setStatus, setStatusMessage);
        setStatus(result.verified ? 'success' : 'error');
        setStatusMessage(
          result.verified
            ? 'Chip gravado e validado com sucesso.'
            : 'Chip gravado, mas a confirmação de leitura falhou. Verifique manualmente.'
        );
        return { success: true, serialNumber: result.serialNumber, verified: result.verified };
      } catch (err) {
        const message = describeNFCError(err);
        setStatus('error');
        setStatusMessage(message);
        return { success: false };
      }
    },
    [supported]
  );

  // ─── Modo contínuo: NUNCA avança automaticamente para o próximo chip sem
  // confirmação de que a gravação atual foi validada por releitura. Se a
  // gravação falhar OU a releitura de confirmação não bater, o ciclo PARA e
  // aguarda uma ação explícita do operador (Tentar novamente ou Pular este
  // chip) — "enquanto não gravar corretamente, não continua".
  //
  // A fila é um SNAPSHOT local (capturado uma vez, no início do modo
  // contínuo), percorrida por índice — e não recalculada a partir do prop
  // reativo `products` a cada chip, o que evitaria avançar corretamente
  // (closures antigas veriam sempre a mesma lista "stale").
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
      onProgram(product.id, result.success, { serialNumber: result.serialNumber, verified: result.verified });
    }
    setLastResult({ product, success: result.success, serialNumber: result.serialNumber, verified: result.verified });

    if (!result.success || !result.verified) {
      // Gravação não confirmada: interrompe o modo contínuo bem aqui.
      // Não avança para o próximo produto da fila até o operador decidir.
      setContinuousRunning(false);
      setPausedProduct(product);
      queueIndexRef.current = index;
      return;
    }

    // Confirmado por releitura do chip: só agora segue automaticamente
    // para o próximo item da fila.
    setPausedProduct(null);
    queueIndexRef.current = index + 1;
    await delay(500);
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
      onProgram(product.id, result.success, { serialNumber: result.serialNumber, verified: result.verified });
    }
    setLastResult({ product, success: result.success, serialNumber: result.serialNumber, verified: result.verified });
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SupportBanner supported={supported} />

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
          <button
            onClick={() => setUrlEditorOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            <Link2 className="h-4 w-4" /> Editar URL de gravação
          </button>
        </div>
      </div>


      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex">
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
        </div>
      </div>

      {mode === 'single' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar produto por UUID, código ou código interno..." className="sm:max-w-md" />
            <select value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none sm:w-auto">
              <option value="">Todos os lotes</option>
              {lots.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
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
                      <Badge colorClass="bg-zinc-500/10 text-zinc-400">{lots.find((l) => l.id === p.lotId)?.code}</Badge>
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
            {lots.map((l) => <option key={l.id} value={l.id}>{l.code} ({l.availableQuantity} disp.)</option>)}
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

      {/* Pausa obrigatória: a gravação não foi confirmada por releitura do
          chip. O fluxo NÃO avança sozinho — o operador precisa aproximar o
          chip de novo e tentar, ou pular conscientemente este item. */}
      {pausedProduct && (
        <div className="flex flex-col gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <p className="text-sm font-semibold text-yellow-300">Gravação não confirmada — o fluxo está pausado</p>
              <p className="mt-0.5 text-xs text-yellow-400/80">
                O chip de <strong>{pausedProduct.internalCode}</strong> não pôde ser gravado ou a releitura de confirmação
                falhou. Aproxime o mesmo chip novamente e tente de novo antes de continuar para o próximo.
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
        <div className={cn('rounded-2xl border p-4', lastResult.success && lastResult.verified ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10')}>
          <div className="flex items-start gap-3">
            {lastResult.success && lastResult.verified ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', lastResult.success && lastResult.verified ? 'text-emerald-400' : 'text-red-400')}>
                {lastResult.success && lastResult.verified ? 'Chip gravado com sucesso — produto liberado para ativação' : lastResult.success ? 'Gravado, mas sem confirmação de leitura' : 'Falha na programação'}
              </p>
              {lastResult.success && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-950 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Código deste produto</span>
                  <span className="font-mono text-base font-bold text-emerald-300">{lastResult.product.activationCode}</span>
                </div>
              )}
              <p className="mt-2 truncate text-xs text-zinc-400">{lastResult.product.internalCode} • {lastResult.product.uuid}</p>
              <p className="text-xs text-zinc-500">{formatDateTime(new Date().toISOString())}</p>
              {lastResult.success && (
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                  {lastResult.verified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> : <ShieldAlert className="h-3.5 w-3.5 text-yellow-400" />}
                  {lastResult.verified ? 'Gravação validada por releitura do chip — já saiu da lista de pendentes' : 'Gravação realizada sem confirmação de leitura'}
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
            O sistema irá aproximar-se do chip real via Web NFC: lê o chip, grava a URL única do produto e confirma a gravação por releitura.
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

/** Executa o ciclo de gravação real reportando os estágios (gravando/validando) na UI. */
async function writeAndVerifyNFCTagWithStages(
  url: string,
  setStatus: (s: ScanStatus) => void,
  setMessage: (m: string) => void
) {
  setStatus('writing');
  setMessage(`Gravando URL ${url} no chip aproximado...`);
  const result = await writeAndVerifyNFCTag(url);
  setStatus('verifying');
  setMessage('Confirmando gravação por releitura do chip...');
  await delay(300);
  return result;
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
}: {
  isOpen: boolean;
  onClose: () => void;
  recordedProducts: Product[];
  lots: Lot[];
  lastProductId?: string;
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
                    <Badge colorClass="bg-zinc-500/10 text-zinc-400">{lotCode || 'Sem lote'}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-500 sm:grid-cols-4">
                    <span>Interno: <span className="text-zinc-300">{p.internalCode}</span></span>
                    <span>Status: <span className="text-zinc-300">{p.status}</span></span>
                    <span>Gravado em: <span className="text-zinc-300">{formatDateTime(p.programmedAt)}</span></span>
                    <span>Por: <span className="text-zinc-300">{p.programmedBy || '—'}</span></span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-zinc-600">{p.uuid}</p>
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
              placeholder="https://airnext-xi.vercel.app"
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
