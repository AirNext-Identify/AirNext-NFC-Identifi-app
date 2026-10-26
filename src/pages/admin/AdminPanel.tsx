import { useState, useEffect, useMemo } from 'react';
import { Loader2, ShoppingBag, X, PackageCheck } from 'lucide-react';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { Header } from '@/components/admin/layout/Header';
import { ToastContainer } from '@/components/admin/ui/ToastContainer';
import { DashboardView } from '@/components/admin/modules/DashboardView';
import { CustomersView } from '@/components/admin/modules/CustomersView';
import { CustomerDetailView } from '@/components/admin/modules/CustomerDetailView';
import { ProductsView } from '@/components/admin/modules/ProductsView';
import { ProductDetailView } from '@/components/admin/modules/ProductDetailView';
import { LotsView } from '@/components/admin/modules/LotsView';
import { GoogleView, CreateGoogleLotModal } from '@/components/admin/modules/GoogleView';
import { ProductLineSwitch, type ProductLine } from '@/components/admin/modules/ProductLineSwitch';
import { NFCProgrammerView } from '@/components/admin/modules/NFCProgrammerView';
import { LabelsView } from '@/components/admin/modules/LabelsView';
import { ValidityView } from '@/components/admin/modules/ValidityView';
import { NotificationsView } from '@/components/admin/modules/NotificationsView';
import { NotifyModal } from '@/components/admin/modules/NotifyModal';
import { AnalyticsView } from '@/components/admin/modules/AnalyticsView';
import { SettingsView } from '@/components/admin/modules/SettingsView';
import { GuideView } from '@/components/admin/modules/GuideView';
import { OrdersView } from '@/components/admin/modules/OrdersView';
import { FeedbacksView } from '@/components/admin/modules/FeedbacksView';
import { useSiteFeedbacks } from '@/hooks/useSiteFeedbacks';
import { useAdminData } from '@/hooks/useAdminData';
import { useOrders } from '@/hooks/useOrders';
import { useActivationAlerts, type ActivationAlert } from '@/hooks/useActivationAlerts';
import type { Order } from '@/lib/orders';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminModule, Customer, Lot } from '@/types/admin';

const moduleTitles: Record<AdminModule, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão executiva da plataforma' },
  orders: { title: 'Pedidos', subtitle: 'Pedidos do site em tempo real' },
  feedbacks: { title: 'Feedbacks', subtitle: 'Avaliações dos clientes — publique na landing page' },
  customers: { title: 'Clientes', subtitle: 'Gerenciamento completo de clientes' },
  products: { title: 'Produtos', subtitle: 'Acompanhamento de todos os produtos' },
  lots: { title: 'Lotes', subtitle: 'Geração e controle de lotes' },
  google: { title: 'AirNext Google', subtitle: 'Plaquinhas de avaliação do Google — lotes, ativações e links' },
  nfc: { title: 'Programador NFC', subtitle: 'Gravação física dos chips NFC' },
  labels: { title: 'Etiquetas (QR)', subtitle: 'Imprima QR + código juntos, na mesma ordem' },
  validity: { title: 'Validade', subtitle: 'Controle de vencimentos e renovações' },
  notifications: { title: 'Notificações', subtitle: 'Central de notificações em tempo real' },
  analytics: { title: 'Analytics', subtitle: 'Estatísticas e indicadores' },
  guide: { title: 'Manual & Guia NFC', subtitle: 'Documentação completa e passo a passo de gravação' },
  settings: { title: 'Configurações', subtitle: 'Segurança e preferências' },
};

/**
 * Painel administrativo (ERP interno) da AirNext.
 *
 * Antes era um projeto separado com dados 100% mock (useAdminStore, em
 * memória). Agora vive dentro do SaaS real e todos os dados — clientes,
 * produtos, lotes, gravação NFC, renovações, notificações e logs — vêm do
 * Supabase real, através do hook useAdminData (ver src/hooks/useAdminData.ts
 * e supabase/admin_panel.sql).
 */
export default function AdminPanel() {
  const { logout } = useAuth();
  const [module, setModule] = useState<AdminModule>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [nfcPreselectedLot, setNfcPreselectedLot] = useState<string | null>(null);
  const [nfcPreselectedProduct, setNfcPreselectedProduct] = useState<string | null>(null);
  // AirNext Google aparece junto dos lotes em Lotes e tem uma aba própria em Produtos (sem item próprio no menu).
  const [productsLine, setProductsLine] = useState<ProductLine>('std');
  // Lote cujos produtos estão sendo vistos em Produtos (botão "Ver produtos" em Lotes).
  const [productsLotFilter, setProductsLotFilter] = useState<string | null>(null);
  const [googleLotOpen, setGoogleLotOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<{ fixed: boolean; customer: Customer | null } | null>(null);

  // Aviso de novo pedido (aparece em qualquer módulo do painel)
  const [orderAlerts, setOrderAlerts] = useState<Order[]>([]);
  const {
    orders, loading: ordersLoading, error: ordersError, unseen: unseenOrders,
    setStatus: setOrderStatus, markSeen: markOrderSeen, finalize: finalizeOrder, reopen: reopenOrder, saveNotes: saveOrderNotes, remove: removeOrder,
  } = useOrders((o) => {
    setOrderAlerts((prev) => [o, ...prev].slice(0, 3));
    window.setTimeout(() => setOrderAlerts((prev) => prev.filter((x) => x.id !== o.id)), 15000);
  });

  // Feedbacks do site (gestão + publicação na landing)
  const siteFeedbacks = useSiteFeedbacks();

  // Contador no título da aba: "(2) Novo pedido"
  useEffect(() => {
    const base = 'AirNext Admin';
    document.title = unseenOrders > 0 ? `(${unseenOrders}) Novo pedido · ${base}` : base;
    return () => { document.title = base; };
  }, [unseenOrders]);

  const {
    user,
    loading,
    customers,
    products,
    lots,
    notifications,
    renewals,
    logs,
    nfcRecords,
    toasts,
    stats,
    monthlyStats,
    growthMapData,
    visits,
    updateCustomer,
    changeCustomerStatus,
    deleteCustomer,
    addCustomerNote,
    createProduct,
    deleteProduct,
    duplicateProduct,
    transferProduct,
    renewProduct,
    blockProduct,
    createLot,
    updateLot,
    deleteLot,
    programNFC,
    resetProductProgramming,
    clearFailedProgrammingRecords,
    activateProductForQr,
    createGoogleLot,
    deleteGoogleLot,
    setGoogleRedirect,
    googleScans,
    reloadGoogleScans,
    updateNotification,
    sendNotification,
    deleteNotification,
    appUrl,
    updateAppUrl,
    reloadVisits,
    refreshProducts,
    removeToast,
  } = useAdminData();

  // Aviso de produto ativado por um cliente (aparece em qualquer módulo do painel)
  const [activationCards, setActivationCards] = useState<ActivationAlert[]>([]);
  const { alerts: activationAlerts, unseen: unseenActivations, markSeen: markActivationsSeen } = useActivationAlerts((a) => {
    setActivationCards((prev) => [a, ...prev].slice(0, 3));
    window.setTimeout(() => setActivationCards((prev) => prev.filter((x) => x.id !== a.id)), 15000);
    // Atualiza status da plaquinha e contadores do lote na hora.
    refreshProducts();
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const selectedCustomer = useMemo(() => customers.find((c) => c.id === detailCustomerId), [customers, detailCustomerId]);
  const selectedProduct = useMemo(() => products.find((p) => p.id === detailProductId), [products, detailProductId]);

  // AirNext Google tem seção própria (lotes, ativações, links). As telas padrão
  // (Produtos, Programador NFC, Validade, Analytics) não misturam as duas linhas; só a página de Lotes mostra as duas juntas.
  const stdProducts = useMemo(() => products.filter((p) => p.productLine !== 'GOOGLE'), [products]);
  const stdLots = useMemo(() => lots.filter((l) => l.productLine !== 'GOOGLE'), [lots]);
  const googleProducts = useMemo(() => products.filter((p) => p.productLine === 'GOOGLE'), [products]);
  const googleLots = useMemo(() => lots.filter((l) => l.productLine === 'GOOGLE'), [lots]);

  const handleNavigate = (next: AdminModule, subId?: string) => {
    // 'google' deixou de ser um módulo: os lotes Google ficam na própria página de Lotes.
    if (next === 'google') next = 'lots';
    // Sempre limpa as telas de detalhe ao trocar de módulo. Antes o detalhe do
    // cliente/produto ficava "grudado" e clicar em Clientes/Produtos no menu
    // lateral parecia não fazer nada (o menu parecia travado).
    setProductsLotFilter(null);
    setDetailCustomerId(next === 'customers' && subId ? subId : null);
    setDetailProductId(next === 'products' && subId ? subId : null);
    setModule(next);
    window.scrollTo({ top: 0 });
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleViewLotProducts = (lot: Lot) => {
    handleNavigate('products');
    setProductsLine(lot.productLine === 'GOOGLE' ? 'google' : 'std');
    setProductsLotFilter(lot.id);
  };

  const handleProgramLot = (lotId: string) => {
    setNfcPreselectedLot(lotId);
    handleNavigate('nfc');
  };

  const handleProgramProduct = (productId: string) => {
    setNfcPreselectedProduct(productId);
    handleNavigate('nfc');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando dados do painel administrativo…</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (module === 'customers' && selectedCustomer) {
      return (
        <CustomerDetailView
          customer={selectedCustomer}
          products={products}
          notifications={notifications}
          renewals={renewals}
          logs={logs}
          visits={visits}
          onBack={() => setDetailCustomerId(null)}
          onUpdate={updateCustomer}
          onChangeStatus={changeCustomerStatus}
          onDelete={async (id, opts) => {
            const ok = await deleteCustomer(id, opts);
            if (ok) handleNavigate('customers');
            return ok;
          }}
          onNotify={(c) => setNotifyTarget({ fixed: true, customer: c })}
          onAddNote={addCustomerNote}
          onDeleteNotification={deleteNotification}
        />
      );
    }

    if (module === 'products' && selectedProduct) {
      return (
        <ProductDetailView
          product={selectedProduct}
          customers={customers}
          onBack={() => setDetailProductId(null)}
          onDelete={(id) => {
            deleteProduct(id);
            handleNavigate('products');
          }}
          onDuplicate={duplicateProduct}
          onTransfer={transferProduct}
          onRenew={renewProduct}
          onBlock={blockProduct}
        />
      );
    }

    switch (module) {
      case 'dashboard':
        return <DashboardView stats={stats} customers={customers} products={stdProducts} monthlyStats={monthlyStats} growthMapData={growthMapData} />;
      case 'orders':
        return (
          <OrdersView
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            onSetStatus={setOrderStatus}
            onMarkSeen={markOrderSeen}
            onFinalize={finalizeOrder}
            onReopen={reopenOrder}
            onSaveNotes={saveOrderNotes}
            onDelete={removeOrder}
          />
        );
      case 'feedbacks':
        return (
          <FeedbacksView
            items={siteFeedbacks.items}
            settings={siteFeedbacks.settings}
            loading={siteFeedbacks.loading}
            error={siteFeedbacks.error}
            onUpdate={siteFeedbacks.update}
            onSetStatus={siteFeedbacks.setStatus}
            onDelete={siteFeedbacks.remove}
            onAdd={siteFeedbacks.add}
            onSaveSettings={siteFeedbacks.saveSettings}
          />
        );
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            onView={setDetailCustomerId}
            onChangeStatus={changeCustomerStatus}
            onDelete={deleteCustomer}
            onNotify={(c) => setNotifyTarget({ fixed: true, customer: c })}
          />
        );
      case 'products':
        return (
          <div>
            <ProductLineSwitch value={productsLine} onChange={setProductsLine} stdLabel="Produtos" googleLabel="AirNext Google" onCreateGoogleLot={() => setGoogleLotOpen(true)} />
            {productsLotFilter && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
                <span>Mostrando só os produtos do lote <strong>{lots.find((l) => l.id === productsLotFilter)?.code || '—'}</strong></span>
                <button onClick={() => setProductsLotFilter(null)} className="font-medium text-indigo-300 hover:text-indigo-100">Ver todos</button>
              </div>
            )}
            {productsLine === 'std' ? (
          <ProductsView
            products={productsLotFilter ? stdProducts.filter((p) => p.lotId === productsLotFilter) : stdProducts}
            customers={customers}
            lots={stdLots.map((l) => ({ id: l.id, code: l.code }))}
            onView={setDetailProductId}
            onDelete={deleteProduct}
            onDuplicate={duplicateProduct}
            onTransfer={transferProduct}
            onRenew={renewProduct}
            onBlock={blockProduct}
            onCreate={createProduct}
            onProgramProduct={handleProgramProduct}
            onActivateQr={activateProductForQr}
            appUrl={appUrl}
            onOpenNfc={() => setModule('nfc')}
          />
            ) : (
              <GoogleView
                view="plates"
                products={productsLotFilter ? googleProducts.filter((p) => p.lotId === productsLotFilter) : googleProducts}
                lots={googleLots}
                customers={customers}
                appUrl={appUrl}
                scans={googleScans}
                onCreateLot={createGoogleLot}
                onDeleteLot={deleteGoogleLot}
                onBlock={blockProduct}
                onSetRedirect={setGoogleRedirect}
                onProgramLot={handleProgramLot}
                onProgramProduct={handleProgramProduct}
                onReloadScans={reloadGoogleScans}
              />
            )}
          </div>
        );
      case 'lots':
      case 'google':
        // Lotes padrão e AirNext Google na mesma lista.
        return (
          <LotsView
            lots={lots}
            products={products}
            customers={customers}
            onCreate={createLot}
            onUpdate={updateLot}
            onDelete={deleteLot}
            onProgramLot={handleProgramLot}
            onProgramProduct={handleProgramProduct}
            onCreateGoogleLot={() => setGoogleLotOpen(true)}
            onDeleteGoogleLot={deleteGoogleLot}
            activationAlerts={activationAlerts}
            onMarkActivationsSeen={markActivationsSeen}
            onViewLotProducts={handleViewLotProducts}
          />
        );
      case 'nfc':
        return (
          <NFCProgrammerView
            products={products}
            lots={lots}
            nfcRecords={nfcRecords}
            onProgram={programNFC}
            onResetProduct={resetProductProgramming}
            onClearFailed={clearFailedProgrammingRecords}
            preselectedLotId={nfcPreselectedLot}
            onLotConsumed={() => setNfcPreselectedLot(null)}
            preselectedProductId={nfcPreselectedProduct}
            onProductConsumed={() => setNfcPreselectedProduct(null)}
            appUrl={appUrl}
            onUpdateAppUrl={updateAppUrl}
          />
        );
      case 'labels':
        return <LabelsView products={products} lots={lots} appUrl={appUrl} />;
      case 'validity':
        return <ValidityView products={stdProducts} customers={customers} onRenew={renewProduct} />;
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            customers={customers}
            products={products}
            onUpdate={updateNotification}
            onSend={() => setNotifyTarget({ fixed: false, customer: null })}
            onResend={sendNotification}
            onDelete={deleteNotification}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            customers={customers}
            products={products}
            renewals={renewals}
            visits={visits}
            googleScans={googleScans}
            onRefresh={async () => { await Promise.all([reloadGoogleScans(), reloadVisits()]); }}
          />
        );
      case 'guide':
        return <GuideView onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsView appUrl={appUrl} onUpdateAppUrl={updateAppUrl} logs={logs} />;
      default:
        return <DashboardView stats={stats} customers={customers} products={stdProducts} monthlyStats={monthlyStats} growthMapData={growthMapData} />;
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <Sidebar
        active={module}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
        userName={user?.name}
        userEmail={user?.email}
        onLogout={handleLogout}
        badges={{ orders: unseenOrders, feedbacks: siteFeedbacks.pending, lots: unseenActivations }}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Header
          title={moduleTitles[module].title}
          subtitle={moduleTitles[module].subtitle}
          customers={customers}
          products={products}
          lots={lots}
          notifications={notifications}
          onNavigate={handleNavigate}
          onResolveNotification={(id) => updateNotification(id, { status: 'Resolvido', resolvedAt: new Date().toISOString() })}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      {/* Aviso de novo pedido */}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {orderAlerts.map((o) => (
          <div key={o.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-indigo-500/40 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">Novo pedido {o.order_number}</p>
              <p className="truncate text-xs text-zinc-400">
                {o.customer_name || 'Cliente'} · {Number(o.subtotal) > 0 ? `R$ ${Number(o.subtotal).toFixed(2).replace('.', ',')}` : 'sob consulta'}
              </p>
              <button
                onClick={() => { setModule('orders'); setOrderAlerts((p) => p.filter((x) => x.id !== o.id)); }}
                className="mt-2 text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                Ver pedido →
              </button>
            </div>
            <button onClick={() => setOrderAlerts((p) => p.filter((x) => x.id !== o.id))} className="text-zinc-500 hover:text-zinc-300" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {activationCards.map((a) => (
          <div key={a.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">
                {a.product_line === 'GOOGLE' ? 'Plaquinha Google ativada' : 'Produto ativado'}
              </p>
              <p className="truncate text-xs text-zinc-400">
                {a.customer_name || a.customer_email || 'Um cliente'} · <span className="font-mono">{a.product_code || '—'}</span>
                {a.lot_code ? ` · ${a.lot_code}` : ''}
              </p>
              <button
                onClick={() => { handleNavigate('lots'); markActivationsSeen([a.id]); setActivationCards((p) => p.filter((x) => x.id !== a.id)); }}
                className="mt-2 text-xs font-medium text-emerald-300 hover:text-emerald-200"
              >
                Ver lotes →
              </button>
            </div>
            <button onClick={() => setActivationCards((p) => p.filter((x) => x.id !== a.id))} className="text-zinc-500 hover:text-zinc-300" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <CreateGoogleLotModal
        isOpen={googleLotOpen}
        existingLots={googleLots}
        onClose={() => setGoogleLotOpen(false)}
        onCreate={async (data) => {
          const ok = await createGoogleLot(data);
          if (ok) { setModule('lots'); setDetailProductId(null); setDetailCustomerId(null); }
          return ok;
        }}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <NotifyModal
        isOpen={!!notifyTarget}
        onClose={() => setNotifyTarget(null)}
        customers={customers}
        fixedCustomer={notifyTarget?.fixed ? notifyTarget.customer : null}
        onSend={(title, message, channel, customerId) => sendNotification(title, message, channel, customerId)}
      />
    </div>
  );
}
