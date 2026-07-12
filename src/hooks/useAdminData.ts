import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateUUID,
  generateActivationCode,
  generateInternalCode,
  generateUnique,
  addYears,
  differenceInDays,
} from '@/lib/adminUtils';
import type {
  Customer,
  Product,
  Lot,
  Notification,
  Renewal,
  LogEntry,
  NFCProgrammingRecord,
  CustomerStatus,
  ProductStatus,
  Toast,
  Address,
} from '@/types/admin';

// =============================================================================
// useAdminData — hook REAL (Supabase) do painel administrativo AirNext.
//
// Mantém EXATAMENTE a mesma interface pública que o antigo hook de mock
// (useAdminStore), então todos os módulos do painel (Dashboard, Clientes,
// Produtos, Lotes, Programador NFC, Validade, Notificações, Analytics,
// Manual e Configurações) funcionam sem nenhuma alteração — só o "motor"
// por trás mudou de arrays em memória para o Supabase real.
//
// Tabelas usadas (ver supabase/admin_panel.sql):
//   - products            (já existia — ganhou colunas novas, aditivas)
//   - profiles            (já existia — nome/e-mail do cartão do cliente)
//   - lots                (novo)
//   - nfc_programming_records (novo)
//   - renewals            (novo)
//   - admin_logs          (novo)
//   - admin_notifications (novo)
//   - customer_profiles   (novo — CRM/cobrança por conta)
// =============================================================================

interface ProductRow {
  id: string;
  code: string | null;
  nfc_uuid: string | null;
  internal_code: string | null;
  user_id: string | null;
  status: string;
  category: string | null;
  slug: string | null;
  theme: string | null;
  visibility: string | null;
  lote_name: string | null;
  lot_id: string | null;
  product_type: string | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
  programmed_at: string | null;
  programmed_by: string | null;
  programmed_by_name: string | null;
  chip_serial_number: string | null;
}

const PRODUCT_SELECT =
  'id, code, nfc_uuid, internal_code, user_id, status, category, slug, theme, visibility, lote_name, lot_id, product_type, activated_at, expires_at, created_at, programmed_at, programmed_by, programmed_by_name, chip_serial_number';

// URL pública usada para montar os links gravados nos chips NFC e nos QR
// Codes. Ordem de prioridade:
//   1) app_settings.nfc_base_url — configurável em Configurações, no painel,
//      sem precisar mexer em código. É o que vale para os chips gravados a
//      partir de agora, mesmo se o domínio mudar no futuro.
//   2) VITE_PUBLIC_APP_URL (definida no .env) — usada apenas como valor
//      inicial/fallback antes da config carregar do banco.
//   3) window.location.origin, se não for localhost.
//   4) domínio de produção fixo, como último recurso.
function envOrFallbackUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')) {
    return window.location.origin;
  }
  return 'https://airnext-xi.vercel.app';
}

/** DB (NAO_PROGRAMADO/DISPONIVEL/ATIVO/EXPIRADO/BLOQUEADO/CANCELADO) → rótulo da UI do painel. */
function mapDbStatusToUi(row: ProductRow, recentlyRenewed: boolean): ProductStatus {
  switch (row.status) {
    case 'NAO_PROGRAMADO':
      return 'Não programado';
    case 'DISPONIVEL':
      return 'Disponível para ativação';
    case 'BLOQUEADO':
      return 'Bloqueado';
    case 'CANCELADO':
      return 'Cancelado';
    case 'EXPIRADO':
      return 'Expirado';
    case 'ATIVO': {
      if (recentlyRenewed) return 'Renovado';
      if (!row.expires_at) return 'Ativado';
      const days = differenceInDays(new Date(row.expires_at), new Date());
      if (days <= 0) return 'Expirado';
      if (days <= 180) return 'Expirando';
      return 'Ativado';
    }
    default:
      return 'Não programado';
  }
}

function mapAdminProduct(row: ProductRow, renewedRecently: Set<string>, baseUrl: string): Product {
  const uuid = row.nfc_uuid || '';
  return {
    id: row.id,
    uuid,
    activationCode: row.code || '',
    type: (row.product_type as Product['type']) || undefined,
    customerId: row.user_id || undefined,
    status: mapDbStatusToUi(row, renewedRecently.has(row.id)),
    createdAt: row.created_at,
    internalCode: row.internal_code || '—',
    activatedAt: row.activated_at || undefined,
    expiresAt: row.expires_at || undefined,
    daysRemaining: row.expires_at ? differenceInDays(new Date(row.expires_at), new Date()) : undefined,
    lotId: row.lot_id || '',
    programmedAt: row.programmed_at || undefined,
    programmedBy: row.programmed_by_name || undefined,
    nfcUrl: uuid ? `${baseUrl}/n/${uuid}` : '',
  };
}

function mapLot(row: any): Lot {
  return {
    id: row.id,
    code: row.code,
    description: row.description || undefined,
    quantity: row.quantity,
    usedQuantity: row.used_quantity,
    availableQuantity: row.available_quantity,
    supplier: row.supplier || undefined,
    createdAt: row.created_at,
    notes: row.notes || undefined,
  };
}

function mapNfcRecord(row: any): NFCProgrammingRecord {
  return {
    id: row.id,
    productId: row.product_id,
    uuid: row.nfc_uuid,
    programmedAt: row.programmed_at,
    programmedBy: row.programmed_by_name || row.programmed_by || 'Admin',
    status: row.status,
    lotId: row.lot_id || undefined,
    chipSerialNumber: row.chip_serial_number || undefined,
    verified: row.verified,
  };
}

function mapRenewal(row: any): Renewal {
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.user_id || '',
    renewedAt: row.renewed_at,
    previousExpiresAt: row.previous_expires_at || undefined,
    newExpiresAt: row.new_expires_at,
    periodYears: row.period_years,
    amount: Number(row.amount) || 0,
  };
}

function mapLog(row: any): LogEntry {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id || '',
    performedBy: row.performed_by_name || 'Admin',
    performedAt: row.performed_at,
    details: row.details || '',
  };
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    customerId: row.user_id || undefined,
    productId: row.product_id || undefined,
    title: row.title,
    message: row.message,
    channel: row.channel,
    sentAt: row.sent_at,
    openedAt: row.opened_at || undefined,
    resolvedAt: row.resolved_at || undefined,
    status: row.status,
    trigger: row.trigger || 'manual',
  };
}

const emptyAddress: Address = { street: '', city: '', state: '', zipCode: '', country: 'Brasil' };

export function useAdminData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileRows, setProfileRows] = useState<any[]>([]);
  const [customerProfileRows, setCustomerProfileRows] = useState<any[]>([]);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [lotRows, setLotRows] = useState<any[]>([]);
  const [nfcRows, setNfcRows] = useState<any[]>([]);
  const [renewalRows, setRenewalRows] = useState<any[]>([]);
  const [logRows, setLogRows] = useState<any[]>([]);
  const [notifRows, setNotifRows] = useState<any[]>([]);
  const [visitRows, setVisitRows] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // URL base gravada nos chips/QR codes. Começa com o fallback (env/origin)
  // e é substituída pelo valor salvo em app_settings assim que carrega —
  // assim a tela nunca fica "em branco" enquanto o Supabase responde.
  const [appUrl, setAppUrl] = useState<string>(() => envOrFallbackUrl());

  // Sets de valores já usados, para nunca gerar UUID/código de ativação/
  // código interno/código de lote duplicado — populados a partir dos dados
  // reais carregados do Supabase (e não apenas de um seed local).
  const usedNfcUuids = useRef<Set<string>>(new Set());
  const usedActivationCodes = useRef<Set<string>>(new Set());
  const usedInternalCodes = useRef<Set<string>>(new Set());
  const usedLotCodes = useRef<Set<string>>(new Set());

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = generateUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addLog = useCallback(
    async (action: LogEntry['action'], entityType: LogEntry['entityType'], entityId: string, details: string) => {
      const row = {
        action,
        entity_type: entityType,
        entity_id: entityId,
        performed_by: user?.id || null,
        performed_by_name: user?.name || 'Admin',
        performed_at: new Date().toISOString(),
        details,
      };
      // Otimista: aparece na tela imediatamente, sem esperar o round-trip.
      setLogRows((prev) => [{ ...row, id: `local-${generateUUID()}` }, ...prev].slice(0, 300));
      const { error } = await supabase.from('admin_logs').insert(row);
      if (error) console.error('Falha ao gravar log de auditoria:', error);
    },
    [user]
  );

  const reloadAll = useCallback(async () => {
    setLoading(true);
    const [profilesRes, custProfRes, productsRes, lotsRes, nfcRes, renewalsRes, logsRes, notifRes, settingsRes, visitsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, name, email, created_at'),
      supabase.from('customer_profiles').select('*'),
      supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false }),
      supabase.from('lots').select('*').order('created_at', { ascending: false }),
      supabase.from('nfc_programming_records').select('*').order('programmed_at', { ascending: false }).limit(500),
      supabase.from('renewals').select('*').order('renewed_at', { ascending: false }),
      supabase.from('admin_logs').select('*').order('performed_at', { ascending: false }).limit(300),
      supabase.from('admin_notifications').select('*').order('sent_at', { ascending: false }),
      supabase.from('app_settings').select('key, value').eq('key', 'nfc_base_url').maybeSingle(),
      supabase.from('visits').select('id, product_id, type, action, city, device, created_at').order('created_at', { ascending: false }).limit(2000),
    ]);

    const loadErrors: string[] = [];
    if (profilesRes.error) { console.error('Falha ao carregar profiles:', profilesRes.error); loadErrors.push(`profiles: ${profilesRes.error.message}`); }
    if (custProfRes.error) { console.error('Falha ao carregar customer_profiles:', custProfRes.error); loadErrors.push(`customer_profiles: ${custProfRes.error.message}`); }
    if (productsRes.error) { console.error('Falha ao carregar products:', productsRes.error); loadErrors.push(`products: ${productsRes.error.message}`); }
    if (lotsRes.error) { console.error('Falha ao carregar lots:', lotsRes.error); loadErrors.push(`lots: ${lotsRes.error.message}`); }
    if (nfcRes.error) { console.error('Falha ao carregar nfc_programming_records:', nfcRes.error); loadErrors.push(`nfc_programming_records: ${nfcRes.error.message}`); }
    if (renewalsRes.error) { console.error('Falha ao carregar renewals:', renewalsRes.error); loadErrors.push(`renewals: ${renewalsRes.error.message}`); }
    if (logsRes.error) { console.error('Falha ao carregar admin_logs:', logsRes.error); loadErrors.push(`admin_logs: ${logsRes.error.message}`); }
    if (notifRes.error) { console.error('Falha ao carregar admin_notifications:', notifRes.error); loadErrors.push(`admin_notifications: ${notifRes.error.message}`); }
    if (visitsRes.error) { console.error('Falha ao carregar visits:', visitsRes.error); loadErrors.push(`visits: ${visitsRes.error.message}`); }
    // app_settings é opcional: se a tabela ainda não existir (script SQL
    // delta não rodado), não trava o resto do painel — só mantém o fallback.
    if (settingsRes.error) {
      console.warn('Configuração de URL (app_settings) indisponível, usando fallback:', settingsRes.error.message);
    } else if (settingsRes.data?.value) {
      setAppUrl(String(settingsRes.data.value).replace(/\/$/, ''));
    }

    if (loadErrors.length > 0) {
      addToast(`Falha ao carregar dados do painel (${loadErrors.length} tabela(s)). Veja o console para detalhes.`, 'error');
    }

    const products = (productsRes.data as ProductRow[] | null) || [];
    const lots = lotsRes.data || [];

    setProfileRows(profilesRes.data || []);
    setCustomerProfileRows(custProfRes.data || []);
    setProductRows(products);
    setLotRows(lots);
    setNfcRows(nfcRes.data || []);
    setRenewalRows(renewalsRes.data || []);
    setLogRows(logsRes.data || []);
    setNotifRows(notifRes.data || []);
    setVisitRows(visitsRes.data || []);

    usedNfcUuids.current = new Set(products.map((p) => p.nfc_uuid).filter(Boolean) as string[]);
    usedActivationCodes.current = new Set(products.map((p) => p.code).filter(Boolean) as string[]);
    usedInternalCodes.current = new Set(products.map((p) => p.internal_code).filter(Boolean) as string[]);
    usedLotCodes.current = new Set(lots.map((l: any) => (l.code || '').toUpperCase()));

    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // ─── Produtos recentemente renovados (últimas 72h) — usados só para
  // exibir o rótulo "Renovado" em vez de "Ativado", sem nunca gravar esse
  // rótulo como status real no banco (o status real continua ATIVO, que é
  // o único valor que o resto do app — NfcRedirect, ativação, etc — entende).
  const renewedRecentlySet = useMemo(() => {
    const set = new Set<string>();
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    for (const r of renewalRows) {
      if (new Date(r.renewed_at).getTime() >= cutoff) set.add(r.product_id);
    }
    return set;
  }, [renewalRows]);

  const products: Product[] = useMemo(
    () => productRows.map((row) => mapAdminProduct(row, renewedRecentlySet, appUrl)),
    [productRows, renewedRecentlySet, appUrl]
  );

  const lots: Lot[] = useMemo(() => lotRows.map(mapLot), [lotRows]);
  const nfcRecords: NFCProgrammingRecord[] = useMemo(() => nfcRows.map(mapNfcRecord), [nfcRows]);
  const renewals: Renewal[] = useMemo(() => renewalRows.map(mapRenewal), [renewalRows]);
  const logs: LogEntry[] = useMemo(() => logRows.map(mapLog), [logRows]);
  const notifications: Notification[] = useMemo(() => notifRows.map(mapNotification), [notifRows]);

  // ─── Visitas/acessos reais, já ligadas ao cliente dono do produto ───────
  // Usado pela aba "Acessos" em CustomerDetailView. Antes essa aba nunca
  // buscava dado nenhum (sempre mostrava "Sem registros"), mesmo havendo
  // acessos reais registrados na tabela `visits`.
  const visits = useMemo(() => {
    const ownerByProduct = new Map<string, string | undefined>();
    for (const p of productRows) ownerByProduct.set(p.id, p.user_id || undefined);
    return visitRows.map((v: any) => ({
      id: v.id,
      productId: v.product_id as string | undefined,
      customerId: v.product_id ? ownerByProduct.get(v.product_id) : undefined,
      type: v.type as 'nfc' | 'qr' | 'link' | undefined,
      action: v.action as string | undefined,
      city: v.city as string | undefined,
      device: v.device as string | undefined,
      createdAt: v.created_at as string,
    }));
  }, [visitRows, productRows]);

  // ─── Clientes: junta profiles (nome/e-mail do cartão) + customer_profiles
  // (CRM/cobrança) + agregados calculados a partir dos produtos já carregados.
  const customers: Customer[] = useMemo(() => {
    const byUser = new Map<string, any>();
    for (const p of profileRows) {
      if (!p.user_id || byUser.has(p.user_id)) continue;
      byUser.set(p.user_id, p);
    }
    const crmByUser = new Map<string, any>();
    for (const c of customerProfileRows) crmByUser.set(c.user_id, c);

    const productsByUser = new Map<string, ProductRow[]>();
    for (const p of productRows) {
      if (!p.user_id) continue;
      const arr = productsByUser.get(p.user_id) || [];
      arr.push(p);
      productsByUser.set(p.user_id, arr);
    }

    // Garante que todo usuário com CRM cadastrado apareça mesmo que ainda
    // não tenha nenhum produto/perfil público (ex.: cliente recém-criado).
    for (const userId of crmByUser.keys()) {
      if (!byUser.has(userId)) byUser.set(userId, { user_id: userId, name: '', email: crmByUser.get(userId)?.email || '', created_at: crmByUser.get(userId)?.created_at });
    }

    const list: Customer[] = [];
    for (const [userId, profile] of byUser.entries()) {
      const crm = crmByUser.get(userId);
      const ownProducts = productsByUser.get(userId) || [];
      const activatedProducts = ownProducts.filter((p) => p.status === 'ATIVO');
      const firstActivationAt = activatedProducts
        .map((p) => p.activated_at)
        .filter(Boolean)
        .sort()[0];
      const upcomingExpiries = activatedProducts
        .map((p) => p.expires_at)
        .filter(Boolean)
        .sort();
      const nextRenewalDate = upcomingExpiries[0] || '';
      const daysRemaining = nextRenewalDate ? differenceInDays(new Date(nextRenewalDate), new Date()) : 0;
      const lastAccessAt =
        ownProducts
          .map((p) => p.activated_at || p.created_at)
          .filter(Boolean)
          .sort()
          .slice(-1)[0] || profile.created_at || '';

      list.push({
        id: userId,
        name: profile.name || crm?.company || 'Cliente sem nome',
        company: crm?.company || '',
        phone: crm?.phone || '',
        email: profile.email || crm?.email || '',
        document: crm?.document || '',
        address: crm?.address && Object.keys(crm.address).length ? { ...emptyAddress, ...crm.address } : emptyAddress,
        plan: crm?.plan || 'Starter',
        planValue: Number(crm?.plan_value) || 0,
        registeredAt: profile.created_at || '',
        status: (crm?.status as CustomerStatus) || 'Ativo',
        productCount: ownProducts.length,
        firstActivationAt: firstActivationAt || undefined,
        nextRenewalDate,
        daysRemaining,
        lastAccessAt,
        avatarUrl: undefined,
        internalNotes: crm?.internal_notes || '',
      });
    }

    return list.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
  }, [profileRows, customerProfileRows, productRows]);

  // ─── Estatísticas do Dashboard ──────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === 'Ativo').length;
    const blockedCustomers = customers.filter((c) => c.status === 'Bloqueado').length;
    const expiringCustomers = customers.filter((c) => c.daysRemaining <= 180 && c.daysRemaining > 0).length;
    const expiredCustomers = customers.filter((c) => c.daysRemaining <= 0 && c.productCount > 0).length;
    const availableProducts = products.filter((p) => p.status === 'Disponível para ativação').length;
    const activatedProducts = products.filter((p) => p.status === 'Ativado' || p.status === 'Renovado' || p.status === 'Expirando').length;
    const notActivatedProducts = products.filter((p) => p.status === 'Não programado').length;
    const now = new Date();
    const activationsToday = products.filter((p) => p.activatedAt && new Date(p.activatedAt).toDateString() === now.toDateString()).length;
    const activationsThisMonth = products.filter((p) => {
      if (!p.activatedAt) return false;
      const d = new Date(p.activatedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const renewalsThisMonth = renewals.filter((r) => {
      const d = new Date(r.renewedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      expiringCustomers,
      expiredCustomers,
      availableProducts,
      activatedProducts,
      notActivatedProducts,
      activationsToday,
      activationsThisMonth,
      renewalsThisMonth,
    };
  }, [customers, products, renewals]);

  // ─── Gráficos reais (substituem os dados fixos de mockData.ts) ──────────
  const monthlyStats = useMemo(() => {
    const months: { key: string; month: string }[] = [];
    const now = new Date();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: monthNames[d.getMonth()] });
    }
    const firstSeenUser = new Map<string, string>();
    const sortedProducts = [...productRows].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    for (const p of sortedProducts) {
      if (p.user_id && !firstSeenUser.has(p.user_id)) firstSeenUser.set(p.user_id, p.created_at);
    }

    return months.map(({ key, month }) => {
      const [y, m] = key.split('-').map(Number);
      const inMonth = (iso: string | null) => {
        if (!iso) return false;
        const d = new Date(iso);
        return d.getFullYear() === y && d.getMonth() === m;
      };
      const activations = productRows.filter((p) => inMonth(p.activated_at)).length;
      const available = productRows.filter((p) => p.status === 'DISPONIVEL' && new Date(p.created_at) <= new Date(y, m + 1, 0)).length;
      const activated = productRows.filter((p) => p.status === 'ATIVO' && p.activated_at && new Date(p.activated_at) <= new Date(y, m + 1, 0)).length;
      const expiring = productRows.filter((p) => {
        if (!p.expires_at) return false;
        const days = differenceInDays(new Date(p.expires_at), new Date(y, m + 1, 0));
        return days > 0 && days <= 180 && new Date(p.expires_at) >= new Date(y, m, 1);
      }).length;
      const expired = productRows.filter((p) => p.status === 'EXPIRADO' && p.expires_at && inMonth(p.expires_at)).length;
      const newCustomers = Array.from(firstSeenUser.entries()).filter(([, createdAt]) => inMonth(createdAt)).length;
      return { month, activations, available, activated, expiring, expired, newCustomers };
    });
  }, [productRows]);

  const growthMapData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of customerProfileRows) {
      const state = (c.address?.state || '').toString().trim().toUpperCase();
      if (!state) continue;
      counts.set(state, (counts.get(state) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([state, value]) => ({ state, value }))
      .sort((a, b) => b.value - a.value);
  }, [customerProfileRows]);

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD — CLIENTES
  // ═══════════════════════════════════════════════════════════════════════
  const upsertCustomerProfile = useCallback(async (id: string, patch: Record<string, any>) => {
    const existing = customerProfileRows.find((c) => c.user_id === id);
    const payload = { user_id: id, ...existing, ...patch };
    const { error } = await supabase.from('customer_profiles').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.error('Falha ao salvar CRM do cliente:', error);
      addToast(`Não foi possível salvar os dados do cliente: ${error?.message || 'erro desconhecido'}`, 'error');
      return false;
    }
    setCustomerProfileRows((prev) => {
      const idx = prev.findIndex((c) => c.user_id === id);
      if (idx === -1) return [...prev, payload];
      const next = [...prev];
      next[idx] = payload;
      return next;
    });
    return true;
  }, [customerProfileRows, addToast]);

  const updateCustomer = useCallback(
    async (id: string, data: Partial<Customer>) => {
      const patch: Record<string, any> = {};
      if (data.company !== undefined) patch.company = data.company;
      if (data.phone !== undefined) patch.phone = data.phone;
      if (data.document !== undefined) patch.document = data.document;
      if (data.address !== undefined) patch.address = data.address;
      if (data.plan !== undefined) patch.plan = data.plan;
      if (data.planValue !== undefined) patch.plan_value = data.planValue;
      if (data.internalNotes !== undefined) patch.internal_notes = data.internalNotes;

      const ok = await upsertCustomerProfile(id, patch);
      if (!ok) return;

      // Nome/e-mail exibidos vêm de `profiles` (cartão público) — atualiza lá
      // também quando o admin edita esses campos, para manter consistência.
      if (data.name !== undefined || data.email !== undefined) {
        const profilePatch: Record<string, any> = {};
        if (data.name !== undefined) profilePatch.name = data.name;
        if (data.email !== undefined) profilePatch.email = data.email;
        const { error } = await supabase.from('profiles').update(profilePatch).eq('user_id', id);
        if (error) console.error('Falha ao atualizar profiles:', error);
        else setProfileRows((prev) => prev.map((p) => (p.user_id === id ? { ...p, ...profilePatch } : p)));
      }

      await addLog('Edição', 'Customer', id, 'Dados do cliente atualizados.');
      addToast('Cliente atualizado com sucesso.', 'success');
    },
    [upsertCustomerProfile, addLog, addToast]
  );

  const changeCustomerStatus = useCallback(
    async (id: string, status: CustomerStatus) => {
      const ok = await upsertCustomerProfile(id, { status });
      if (!ok) return;
      await addLog('Mudança de status', 'Customer', id, `Status alterado para ${status}.`);
      addToast(`Cliente ${status.toLowerCase()} com sucesso.`, 'success');
      if (status === 'Bloqueado') {
        addToast(
          'Lembrete: bloquear aqui impede o cliente na plataforma, mas para bloquear também o LOGIN é necessário publicar a Edge Function admin-block-user (ver supabase/admin_panel.sql).',
          'info'
        );
      }
    },
    [upsertCustomerProfile, addLog, addToast]
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('customer_profiles').delete().eq('user_id', id);
      if (error) {
        console.error('Falha ao excluir ficha do cliente:', error);
        addToast(`Não foi possível excluir o cliente: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setCustomerProfileRows((prev) => prev.filter((c) => c.user_id !== id));
      await addLog('Exclusão', 'Customer', id, 'Ficha de CRM do cliente removida (a conta de login em si só pode ser excluída via Supabase Admin API/Edge Function).');
      addToast('Cliente removido com sucesso.', 'success');
    },
    [addLog, addToast]
  );

  const addCustomerNote = useCallback(
    async (id: string, note: string) => {
      const existing = customerProfileRows.find((c) => c.user_id === id);
      const current = existing?.internal_notes || '';
      const updated = `${current}\n${new Date().toLocaleString('pt-BR')}: ${note}`.trim();
      const ok = await upsertCustomerProfile(id, { internal_notes: updated });
      if (!ok) return;
      await addLog('Edição', 'Customer', id, 'Observação interna adicionada.');
      addToast('Observação adicionada.', 'success');
    },
    [customerProfileRows, upsertCustomerProfile, addLog, addToast]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD — PRODUTOS
  // ═══════════════════════════════════════════════════════════════════════
  const generateProductIdentity = useCallback(() => {
    const nfc_uuid = generateUnique(generateUUID, usedNfcUuids.current);
    const code = generateUnique(generateActivationCode, usedActivationCodes.current);
    const internal_code = generateUnique(() => generateInternalCode('AIR', 1), usedInternalCodes.current);
    return { nfc_uuid, code, internal_code };
  }, []);

  const createProduct = useCallback(
    async (data: Partial<Product>) => {
      const { nfc_uuid, code, internal_code } = generateProductIdentity();
      const row = {
        code,
        nfc_uuid,
        internal_code,
        status: 'NAO_PROGRAMADO',
        lot_id: data.lotId || null,
        product_type: data.type || null,
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error } = await supabase.from('products').insert(row).select(PRODUCT_SELECT).single();
      if (error || !inserted) {
        console.error('Falha ao criar produto:', error);
        addToast(`Não foi possível criar o produto: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setProductRows((prev) => [inserted as ProductRow, ...prev]);
      await addLog('Cadastro', 'Product', inserted.id, `Produto ${internal_code} criado com UUID único ${nfc_uuid}.`);
      addToast('Produto criado com sucesso — UUID e código únicos gerados.', 'success');
    },
    [generateProductIdentity, addLog, addToast]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const product = productRows.find((p) => p.id === id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Falha ao excluir produto:', error);
        addToast(`Não foi possível excluir o produto: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setProductRows((prev) => prev.filter((p) => p.id !== id));

      // Mantém used_quantity/available_quantity do lote batendo com a
      // realidade: sem isto, apagar um produto gerado a partir de um lote
      // deixava o lote "mentindo" sobre quantos produtos ainda restam para
      // programar/já foram programados. `quantity` (total histórico gerado)
      // é mantido como está de propósito — é o registro de quantos produtos
      // aquele lote efetivamente encomendou/gerou, e a tabela não permite
      // quantity <= 0, então não faz sentido decrementá-lo aqui.
      if (product?.lot_id) {
        const lot = lotRows.find((l) => l.id === product.lot_id);
        if (lot) {
          const wasProgrammed = product.status !== 'NAO_PROGRAMADO';
          const nextUsed = wasProgrammed ? Math.max(0, (lot.used_quantity || 0) - 1) : (lot.used_quantity || 0);
          const nextAvailable = wasProgrammed ? (lot.available_quantity || 0) : Math.max(0, (lot.available_quantity || 0) - 1);
          const { error: lotError } = await supabase
            .from('lots')
            .update({ used_quantity: nextUsed, available_quantity: nextAvailable })
            .eq('id', lot.id);
          if (lotError) {
            console.error('Falha ao atualizar contadores do lote após exclusão:', lotError);
          } else {
            setLotRows((prev) => prev.map((l) => (l.id === lot.id ? { ...l, used_quantity: nextUsed, available_quantity: nextAvailable } : l)));
          }
        }
      }

      await addLog('Exclusão', 'Product', id, 'Produto removido permanentemente (chip/cartão físico deve ser descartado ou reaproveitado com nova gravação).');
      addToast('Produto excluído com sucesso.', 'success');
    },
    [productRows, lotRows, addLog, addToast]
  );

  const duplicateProduct = useCallback(
    async (id: string) => {
      const source = productRows.find((p) => p.id === id);
      if (!source) return;
      const { nfc_uuid, code, internal_code } = generateProductIdentity();
      const row = {
        code,
        nfc_uuid,
        internal_code,
        status: 'NAO_PROGRAMADO',
        lot_id: source.lot_id,
        product_type: source.product_type,
        lote_name: source.lote_name,
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error } = await supabase.from('products').insert(row).select(PRODUCT_SELECT).single();
      if (error || !inserted) {
        console.error('Falha ao duplicar produto:', error);
        addToast(`Não foi possível duplicar o produto: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setProductRows((prev) => [inserted as ProductRow, ...prev]);

      // Produto duplicado nasce NAO_PROGRAMADO e conta como "disponível" (a
      // programar) no lote de origem, se houver — sem isto o contador do
      // lote ficava desatualizado assim que a duplicata era criada.
      if (source.lot_id) {
        const lot = lotRows.find((l) => l.id === source.lot_id);
        if (lot) {
          const nextAvailable = (lot.available_quantity || 0) + 1;
          const { error: lotError } = await supabase.from('lots').update({ available_quantity: nextAvailable }).eq('id', lot.id);
          if (!lotError) setLotRows((prev) => prev.map((l) => (l.id === lot.id ? { ...l, available_quantity: nextAvailable } : l)));
        }
      }

      await addLog('Cadastro', 'Product', inserted.id, `Produto duplicado a partir de ${source.id} com novo UUID único — precisa ser gravado no Programador NFC antes de ficar disponível.`);
      addToast('Produto duplicado com sucesso — novo UUID gerado.', 'success');
    },
    [productRows, lotRows, generateProductIdentity, addLog, addToast]
  );

  // Suporte/atendimento: atribui (ou remove) manualmente um produto DISPONÍVEL
  // à conta de um cliente — equivalente a ativar em nome dele. Não existe no
  // fluxo real um estado "reservado, mas não ativado" por cliente específico
  // (o cliente ativa sozinho digitando o código), então transferir para um
  // cliente já ativa o produto; remover a transferência desfaz a ativação
  // (uso pontual de suporte, ex.: ativação feita por engano).
  const transferProduct = useCallback(
    async (productId: string, customerId: string | undefined) => {
      const product = productRows.find((p) => p.id === productId);
      if (!product) return;

      if (customerId) {
        const activatedAt = product.activated_at || new Date().toISOString();
        const { error } = await supabase
          .from('products')
          .update({ user_id: customerId, status: 'ATIVO', activated_at: activatedAt })
          .eq('id', productId);
        if (error) {
          console.error('Falha ao transferir produto:', error);
          addToast(`Não foi possível transferir o produto: ${error?.message || 'erro desconhecido'}`, 'error');
          return;
        }
        setProductRows((prev) => prev.map((p) => (p.id === productId ? { ...p, user_id: customerId, status: 'ATIVO', activated_at: activatedAt } : p)));
      } else {
        const { error } = await supabase
          .from('products')
          .update({ user_id: null, status: 'DISPONIVEL', activated_at: null, expires_at: null })
          .eq('id', productId);
        if (error) {
          console.error('Falha ao remover transferência do produto:', error);
          addToast(`Não foi possível remover a transferência: ${error?.message || 'erro desconhecido'}`, 'error');
          return;
        }
        setProductRows((prev) => prev.map((p) => (p.id === productId ? { ...p, user_id: null, status: 'DISPONIVEL', activated_at: null, expires_at: null } : p)));
      }

      await addLog('Troca de cliente', 'Product', productId, `Produto transferido para cliente ${customerId || 'nenhum (desvinculado)'}.`);
      addToast('Produto transferido com sucesso.', 'success');
    },
    [productRows, addLog, addToast]
  );

  const renewProduct = useCallback(
    async (productId: string, customerId: string, years: number) => {
      const product = productRows.find((p) => p.id === productId);
      if (!product) return;
      const resolvedCustomerId = customerId || product.user_id || undefined;
      const previousExpiresAt = product.expires_at || undefined;
      const base = previousExpiresAt && new Date(previousExpiresAt) > new Date() ? new Date(previousExpiresAt) : new Date();
      const newExpiresAt = addYears(base, years).toISOString();

      const { error: updateError } = await supabase
        .from('products')
        .update({ expires_at: newExpiresAt, status: 'ATIVO' })
        .eq('id', productId);
      if (updateError) {
        console.error('Falha ao renovar produto:', updateError);
        addToast(`Não foi possível renovar o produto: ${updateError?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setProductRows((prev) => prev.map((p) => (p.id === productId ? { ...p, expires_at: newExpiresAt, status: 'ATIVO' } : p)));

      const renewalRow = {
        product_id: productId,
        user_id: resolvedCustomerId || null,
        renewed_at: new Date().toISOString(),
        previous_expires_at: previousExpiresAt || null,
        new_expires_at: newExpiresAt,
        period_years: years,
        amount: 59.9 * years,
        renewed_by: user?.id || null,
        renewed_by_name: user?.name || 'Admin',
      };
      const { data: insertedRenewal, error: renewalError } = await supabase.from('renewals').insert(renewalRow).select().single();
      if (renewalError) console.error('Falha ao registrar renovação:', renewalError);
      else setRenewalRows((prev) => [insertedRenewal, ...prev]);

      await addLog('Renovação', 'Product', productId, `Renovação de ${years} ano(s) aplicada.`);
      addToast(`Produto renovado por ${years} ano(s).`, 'success');
    },
    [productRows, user, addLog, addToast]
  );

  const blockProduct = useCallback(
    async (productId: string, blocked: boolean) => {
      const product = productRows.find((p) => p.id === productId);
      if (!product) return;
      // Ao desbloquear, volta para o estado condizente com o histórico real:
      // se já tinha sido ativado (activated_at preenchido), volta a ATIVO;
      // senão, volta a DISPONIVEL (nunca reaparece como "não programado",
      // já que o chip já foi gravado nesse momento).
      const restoredStatus = product.activated_at ? 'ATIVO' : 'DISPONIVEL';
      const nextStatus = blocked ? 'BLOQUEADO' : restoredStatus;
      const { error } = await supabase.from('products').update({ status: nextStatus }).eq('id', productId);
      if (error) {
        console.error('Falha ao alterar bloqueio do produto:', error);
        addToast(`Não foi possível alterar o bloqueio do produto: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setProductRows((prev) => prev.map((p) => (p.id === productId ? { ...p, status: nextStatus } : p)));
      await addLog('Mudança de status', 'Product', productId, blocked ? 'Produto bloqueado.' : 'Produto desbloqueado.');
      addToast(blocked ? 'Produto bloqueado.' : 'Produto desbloqueado.', 'success');
    },
    [productRows, addLog, addToast]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD — LOTES (gera N produtos "Não programado" vinculados ao lote)
  // ═══════════════════════════════════════════════════════════════════════
  const createLot = useCallback(
    async (data: Omit<Lot, 'id' | 'usedQuantity' | 'availableQuantity'>) => {
      let finalCode = data.code.trim().toUpperCase();
      if (usedLotCodes.current.has(finalCode)) {
        let suffix = 2;
        while (usedLotCodes.current.has(`${finalCode}-${suffix}`)) suffix++;
        addToast(`Código "${finalCode}" já existe. Usando "${finalCode}-${suffix}" para evitar conflito.`, 'warning');
        finalCode = `${finalCode}-${suffix}`;
      }
      usedLotCodes.current.add(finalCode);

      const lotRow = {
        code: finalCode,
        description: data.description || null,
        quantity: data.quantity,
        used_quantity: 0,
        available_quantity: data.quantity,
        supplier: data.supplier || null,
        notes: data.notes || null,
        created_by: user?.id || null,
        created_at: data.createdAt || new Date().toISOString(),
      };
      const { data: insertedLot, error: lotError } = await supabase.from('lots').insert(lotRow).select().single();
      if (lotError || !insertedLot) {
        console.error('Falha ao criar lote:', lotError);
        addToast(`Não foi possível criar o lote: ${lotError?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setLotRows((prev) => [insertedLot, ...prev]);

      // Gera os N produtos do lote — todos "NAO_PROGRAMADO" (precisam passar
      // pelo Programador NFC antes de poderem ser vendidos/ativados).
      const newRows = [];
      for (let i = 0; i < data.quantity; i++) {
        const { nfc_uuid, code, internal_code } = generateProductIdentity();
        newRows.push({
          code,
          nfc_uuid,
          internal_code,
          status: 'NAO_PROGRAMADO',
          lot_id: insertedLot.id,
          lote_name: finalCode,
          created_at: insertedLot.created_at,
        });
      }
      const { data: insertedProducts, error: productsError } = await supabase.from('products').insert(newRows).select(PRODUCT_SELECT);
      if (productsError) {
        console.error('Falha ao gerar produtos do lote:', productsError);
        addToast(`Lote criado, mas houve falha ao gerar os produtos: ${productsError.message}`, 'error');
      } else {
        setProductRows((prev) => [...((insertedProducts as ProductRow[]) || []), ...prev]);
      }

      await addLog('Criação de lote', 'Product', insertedLot.id, `Lote ${finalCode} criado com ${data.quantity} unidades — todos os UUIDs e códigos são únicos e não sequenciais.`);
      addToast(`Lote ${finalCode} criado com ${data.quantity} produtos únicos. Clique em "Ver códigos de ativação" no card do lote pra conferir cada código.`, 'success');
    },
    [generateProductIdentity, user, addLog, addToast]
  );

  // Edita metadados do lote (código, descrição, fornecedor, observações).
  // A quantidade NÃO é editável aqui de propósito: ela é o resultado de já
  // ter gerado N produtos reais no banco — mudar o número não apagaria nem
  // criaria produtos sozinho. Para adicionar mais unidades, crie um novo
  // lote; para remover, exclua os produtos individualmente em Produtos.
  const updateLot = useCallback(
    async (id: string, data: Partial<Pick<Lot, 'code' | 'description' | 'supplier' | 'notes'>>) => {
      const lot = lotRows.find((l) => l.id === id);
      if (!lot) return;

      const patch: Record<string, any> = {};
      if (data.code !== undefined) {
        const normalized = data.code.trim().toUpperCase();
        if (!normalized) {
          addToast('O código do lote não pode ficar vazio.', 'error');
          return;
        }
        if (normalized !== lot.code && usedLotCodes.current.has(normalized)) {
          addToast(`Já existe um lote com o código "${normalized}".`, 'error');
          return;
        }
        patch.code = normalized;
      }
      if (data.description !== undefined) patch.description = data.description || null;
      if (data.supplier !== undefined) patch.supplier = data.supplier || null;
      if (data.notes !== undefined) patch.notes = data.notes || null;

      if (Object.keys(patch).length === 0) return;

      const { data: updated, error } = await supabase.from('lots').update(patch).eq('id', id).select().single();
      if (error || !updated) {
        console.error('Falha ao editar lote:', error);
        addToast(`Não foi possível salvar as alterações do lote: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }

      if (patch.code) {
        usedLotCodes.current.delete(lot.code);
        usedLotCodes.current.add(patch.code);
        // Mantém `lote_name` (rótulo legado exibido em produtos) sincronizado
        // com o novo código do lote, para não ficar desatualizado.
        const { error: syncError } = await supabase.from('products').update({ lote_name: patch.code }).eq('lot_id', id);
        if (!syncError) {
          setProductRows((prev) => prev.map((p) => (p.lot_id === id ? { ...p, lote_name: patch.code } : p)));
        }
      }

      setLotRows((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      await addLog('Edição', 'Product', id, `Lote atualizado (${Object.keys(patch).join(', ')}).`);
      addToast('Lote atualizado com sucesso.', 'success');
    },
    [lotRows, addLog, addToast]
  );

  // Exclui o lote. Os produtos já gerados a partir dele NÃO são apagados —
  // eles ficam "órfãos" (lot_id = null via ON DELETE SET NULL no banco),
  // continuam existindo normalmente (podem ter sido programados/ativados/
  // vendidos) e seguem visíveis em Produtos, só perdem o vínculo com o lote
  // excluído. Isso evita apagar acidentalmente produtos já em uso.
  const deleteLot = useCallback(
    async (id: string) => {
      const lot = lotRows.find((l) => l.id === id);
      const { error } = await supabase.from('lots').delete().eq('id', id);
      if (error) {
        console.error('Falha ao excluir lote:', error);
        addToast(`Não foi possível excluir o lote: ${error.message}`, 'error');
        return;
      }
      setLotRows((prev) => prev.filter((l) => l.id !== id));
      setProductRows((prev) => prev.map((p) => (p.lot_id === id ? { ...p, lot_id: null } : p)));
      if (lot) usedLotCodes.current.delete(lot.code);
      await addLog('Exclusão', 'Product', id, `Lote ${lot?.code || id} excluído. Produtos já gerados a partir dele foram mantidos, apenas desvinculados do lote.`);
      addToast('Lote excluído com sucesso.', 'success');
    },
    [lotRows, addLog, addToast]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // NFC — grava o registro de auditoria e, SE E SOMENTE SE a gravação foi
  // confirmada por releitura do chip (verified === true), promove o produto
  // de "Não programado" para "Disponível para ativação". Enquanto não
  // gravar corretamente, o produto NUNCA sai de "Não programado" — não há
  // como "continuar" sem uma gravação validada (ver NFCProgrammerView.tsx).
  // ═══════════════════════════════════════════════════════════════════════
  const programNFC = useCallback(
    async (productId: string, success: boolean, meta?: { serialNumber?: string; verified?: boolean }) => {
      const product = productRows.find((p) => p.id === productId);
      if (!product) return;

      const recordRow = {
        product_id: productId,
        nfc_uuid: product.nfc_uuid || '',
        programmed_at: new Date().toISOString(),
        programmed_by: user?.id || null,
        programmed_by_name: user?.name || 'Admin',
        status: success ? 'Sucesso' : 'Falha',
        lot_id: product.lot_id || null,
        chip_serial_number: meta?.serialNumber || null,
        verified: !!meta?.verified,
      };
      const { data: insertedRecord, error: recordError } = await supabase
        .from('nfc_programming_records')
        .insert(recordRow)
        .select()
        .single();
      if (recordError) console.error('Falha ao registrar programação NFC:', recordError);
      else setNfcRows((prev) => [insertedRecord, ...prev]);

      // Só promove o produto se a gravação foi ESCRITA e VALIDADA por
      // releitura. Falha ou "gravado mas não confirmado" mantém o produto
      // em NAO_PROGRAMADO — é obrigatório tentar novamente.
      if (success && meta?.verified) {
        const patch = {
          status: 'DISPONIVEL',
          programmed_at: recordRow.programmed_at,
          programmed_by: recordRow.programmed_by,
          programmed_by_name: recordRow.programmed_by_name,
          chip_serial_number: recordRow.chip_serial_number,
        };
        const { error: updateError } = await supabase.from('products').update(patch).eq('id', productId);
        if (updateError) {
          console.error('Falha ao atualizar status do produto após gravação NFC:', updateError);
        } else {
          setProductRows((prev) => prev.map((p) => (p.id === productId ? { ...p, ...patch } : p)));
          // Atualiza contadores do lote (usada/disponível).
          if (product.lot_id) {
            const lot = lotRows.find((l) => l.id === product.lot_id);
            if (lot) {
              const usedQuantity = (lot.used_quantity || 0) + 1;
              const availableQuantity = Math.max(0, (lot.available_quantity || 0) - 1);
              const { error: lotUpdateError } = await supabase
                .from('lots')
                .update({ used_quantity: usedQuantity, available_quantity: availableQuantity })
                .eq('id', lot.id);
              if (!lotUpdateError) {
                setLotRows((prev) => prev.map((l) => (l.id === lot.id ? { ...l, used_quantity: usedQuantity, available_quantity: availableQuantity } : l)));
              }
            }
          }
        }
      }

      await addLog(
        'Programação NFC',
        'NFCProgramming',
        insertedRecord?.id || productId,
        `Chip ${product.nfc_uuid} ${success ? 'gravado' : 'falhou'}${meta?.serialNumber ? ` (serial do chip: ${meta.serialNumber})` : ''}${
          meta?.verified ? ' — gravação validada por releitura, produto liberado para ativação' : ' — SEM confirmação de leitura, produto permanece Não programado'
        }.`
      );
      addToast(
        success && meta?.verified
          ? 'Chip gravado e validado com sucesso — produto liberado para ativação.'
          : success
            ? 'Chip gravado, mas a confirmação de leitura falhou — produto continua Não programado.'
            : 'Falha na programação do chip.',
        success && meta?.verified ? 'success' : 'error'
      );
    },
    [productRows, lotRows, user, addLog, addToast]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÕES — URL base gravada nos chips NFC / QR Codes
  // ═══════════════════════════════════════════════════════════════════════
  const updateAppUrl = useCallback(
    async (url: string) => {
      const normalized = url.trim().replace(/\/$/, '');
      if (!normalized) {
        addToast('Informe uma URL válida.', 'error');
        return;
      }
      try {
        // eslint-disable-next-line no-new
        new URL(normalized);
      } catch {
        addToast('URL inválida — use o formato https://seu-dominio.com', 'error');
        return;
      }
      const previous = appUrl;
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'nfc_base_url', value: normalized, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) {
        console.error('Falha ao salvar URL de gravação:', error);
        addToast(`Não foi possível salvar a URL: ${error.message}`, 'error');
        return;
      }
      setAppUrl(normalized);
      await addLog(
        'Edição',
        'System',
        'app_settings',
        `URL de gravação dos chips NFC alterada de "${previous}" para "${normalized}". Produtos gravados a partir de agora usam a nova URL.`
      );
      addToast('URL de gravação atualizada com sucesso.', 'success');
    },
    [appUrl, addLog, addToast]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICAÇÕES (admin → cliente)
  // ═══════════════════════════════════════════════════════════════════════
  const updateNotification = useCallback(
    async (id: string, data: Partial<Notification>) => {
      const patch: Record<string, any> = {};
      if (data.status !== undefined) patch.status = data.status;
      if (data.resolvedAt !== undefined) patch.resolved_at = data.resolvedAt;
      if (data.openedAt !== undefined) patch.opened_at = data.openedAt;
      const { error } = await supabase.from('admin_notifications').update(patch).eq('id', id);
      if (error) {
        console.error('Falha ao atualizar notificação:', error);
        return;
      }
      setNotifRows((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    },
    []
  );

  const deleteNotification = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
      if (error) {
        console.error('Falha ao excluir notificação:', error);
        addToast(`Não foi possível excluir a notificação: ${error.message}`, 'error');
        return;
      }
      setNotifRows((prev) => prev.filter((n) => n.id !== id));
      await addLog('Exclusão', 'Notification', id, 'Notificação removida do painel.');
      addToast('Notificação excluída.', 'success');
    },
    [addLog, addToast]
  );

  const sendNotification = useCallback(
    async (title: string, message: string, channel: Notification['channel'], customerId?: string, productId?: string) => {
      const row = {
        user_id: customerId || null,
        product_id: productId || null,
        title,
        message,
        channel,
        sent_at: new Date().toISOString(),
        status: 'Enviado',
        trigger: 'manual',
      };
      const { data: inserted, error } = await supabase.from('admin_notifications').insert(row).select().single();
      if (error || !inserted) {
        console.error('Falha ao enviar notificação:', error);
        addToast(`Não foi possível enviar a notificação: ${error?.message || 'erro desconhecido'}`, 'error');
        return;
      }
      setNotifRows((prev) => [inserted, ...prev]);
      await addLog('Cadastro', 'Notification', inserted.id, `Notificação enviada via ${channel}.`);
      addToast('Notificação enviada com sucesso.', 'success');
    },
    [addLog, addToast]
  );

  return {
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
    updateNotification,
    sendNotification,
    deleteNotification,
    appUrl,
    updateAppUrl,
    addLog,
    addToast,
    removeToast,
    reload: reloadAll,
  };
}
