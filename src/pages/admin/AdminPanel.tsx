import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { Header } from '@/components/admin/layout/Header';
import { ToastContainer } from '@/components/admin/ui/ToastContainer';
import { DashboardView } from '@/components/admin/modules/DashboardView';
import { CustomersView } from '@/components/admin/modules/CustomersView';
import { CustomerDetailView } from '@/components/admin/modules/CustomerDetailView';
import { ProductsView } from '@/components/admin/modules/ProductsView';
import { ProductDetailView } from '@/components/admin/modules/ProductDetailView';
import { LotsView } from '@/components/admin/modules/LotsView';
import { NFCProgrammerView } from '@/components/admin/modules/NFCProgrammerView';
import { ValidityView } from '@/components/admin/modules/ValidityView';
import { NotificationsView } from '@/components/admin/modules/NotificationsView';
import { AnalyticsView } from '@/components/admin/modules/AnalyticsView';
import { SettingsView } from '@/components/admin/modules/SettingsView';
import { GuideView } from '@/components/admin/modules/GuideView';
import { useAdminData } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminModule } from '@/types/admin';

const moduleTitles: Record<AdminModule, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão executiva da plataforma' },
  customers: { title: 'Clientes', subtitle: 'Gerenciamento completo de clientes' },
  products: { title: 'Produtos', subtitle: 'Acompanhamento de todos os produtos' },
  lots: { title: 'Lotes', subtitle: 'Geração e controle de lotes' },
  nfc: { title: 'Programador NFC', subtitle: 'Gravação física dos chips NFC' },
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
    updateNotification,
    sendNotification,
    appUrl,
    updateAppUrl,
    removeToast,
  } = useAdminData();

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

  const handleNavigate = (next: AdminModule, subId?: string) => {
    setModule(next);
    if (next === 'customers' && subId) {
      setDetailCustomerId(subId);
    } else if (next === 'products' && subId) {
      setDetailProductId(subId);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleProgramLot = (lotId: string) => {
    setNfcPreselectedLot(lotId);
    setModule('nfc');
  };

  const handleProgramProduct = (productId: string) => {
    setNfcPreselectedProduct(productId);
    setModule('nfc');
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
          onBack={() => setDetailCustomerId(null)}
          onUpdate={updateCustomer}
          onChangeStatus={changeCustomerStatus}
          onDelete={(id) => {
            deleteCustomer(id);
            setDetailCustomerId(null);
            setModule('customers');
          }}
          onNotify={(c) => sendNotification('Notificação importante', 'Mensagem enviada pela equipe AirNext.', 'Painel', c.id)}
          onAddNote={addCustomerNote}
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
            setDetailProductId(null);
            setModule('products');
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
        return <DashboardView stats={stats} customers={customers} products={products} monthlyStats={monthlyStats} growthMapData={growthMapData} />;
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            onView={setDetailCustomerId}
            onChangeStatus={changeCustomerStatus}
            onDelete={deleteCustomer}
            onNotify={(c) => sendNotification('Notificação importante', 'Mensagem enviada pela equipe AirNext.', 'Painel', c.id)}
          />
        );
      case 'products':
        return (
          <ProductsView
            products={products}
            customers={customers}
            lots={lots.map((l) => ({ id: l.id, code: l.code }))}
            onView={setDetailProductId}
            onDelete={deleteProduct}
            onDuplicate={duplicateProduct}
            onTransfer={transferProduct}
            onRenew={renewProduct}
            onBlock={blockProduct}
            onCreate={createProduct}
            onProgramProduct={handleProgramProduct}
            onOpenNfc={() => setModule('nfc')}
          />
        );
      case 'lots':
        return <LotsView lots={lots} products={products} onCreate={createLot} onUpdate={updateLot} onDelete={deleteLot} onProgramLot={handleProgramLot} />;
      case 'nfc':
        return (
          <NFCProgrammerView
            products={products}
            lots={lots}
            nfcRecords={nfcRecords}
            onProgram={programNFC}
            preselectedLotId={nfcPreselectedLot}
            onLotConsumed={() => setNfcPreselectedLot(null)}
            preselectedProductId={nfcPreselectedProduct}
            onProductConsumed={() => setNfcPreselectedProduct(null)}
            appUrl={appUrl}
            onUpdateAppUrl={updateAppUrl}
          />
        );
      case 'validity':
        return <ValidityView products={products} customers={customers} onRenew={renewProduct} />;
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            customers={customers}
            products={products}
            onUpdate={updateNotification}
            onSend={sendNotification}
          />
        );
      case 'analytics':
        return <AnalyticsView customers={customers} products={products} renewals={renewals} monthlyStats={monthlyStats} />;
      case 'guide':
        return <GuideView onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsView appUrl={appUrl} onUpdateAppUrl={updateAppUrl} />;
      default:
        return <DashboardView stats={stats} customers={customers} products={products} monthlyStats={monthlyStats} growthMapData={growthMapData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar
        active={module}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
        userName={user?.name}
        userEmail={user?.email}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 flex-col lg:pl-64">
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
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
