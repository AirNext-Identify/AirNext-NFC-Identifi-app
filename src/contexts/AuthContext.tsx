import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

import { supabase } from '../lib/supabase';
import { mapProduct } from '../lib/mapProduct';
import { getPublicProfile, recordVisit } from '../lib/publicApi';
import type { Product } from '../types/product';
import type { Feedback } from '../types/feedback';

export type { Product };

export type ProductType = 'CARTAO' | 'PULSEIRA' | 'CHAVEIRO' | 'PLAQUINHA_PET' | 'ETIQUETA';

export type Category = 'PERSONAL' | 'BUSINESS' | 'PET' | 'KIDS' | 'SENIOR' | 'TEA';
export type ProfileTheme =
  | 'claro' | 'escuro' | 'moderno' | 'minimalista' | 'empresarial'
  | 'indigo' | 'cyber' | 'ocean' | 'sunset' | 'forest' | 'snow' | 'midnight' | 'wine'
  | 'pet-paws' | 'pet-nature' | 'pet-cute' | 'pet-sunny' | 'pet-ocean' | 'pet-lavender'
  | 'kids-rainbow' | 'kids-candy' | 'kids-space' | 'kids-jungle' | 'kids-ocean' | 'kids-dino'
  | 'tea-puzzle' | 'tea-calm' | 'tea-soft' | 'tea-neutral' | 'tea-garden' | 'tea-lavender'
  | 'biz-slate' | 'biz-navy' | 'biz-charcoal' | 'biz-cream' | 'biz-steel' | 'biz-bronze';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

export interface Visit {
  id: string;
  productId: string;
  type: 'nfc' | 'qr' | 'link';
  action?: string;
  city?: string;
  device?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'visit' | 'update' | 'activation' | 'system' | 'login' | 'admin';
  message: string;
  title?: string;
  productId?: string;
  productName?: string;
  userId?: string;
  userName?: string;
  origin?: string;
  read: boolean;
  createdAt: string;
}

interface Ctx {
  user: User | null;
  products: Product[];
  allProducts: Product[];
  visits: Visit[];
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  hasProfile: boolean | null;
  /** Motivo de bloqueio/suspensão exibido na tela de login após um logout forçado. */
  blockedReason: string | null;
  clearBlockedReason: () => void;

  // Admin-only data (populated only when user.role === 'ADMIN', carregado
  // sob demanda — ver loadAdminData e AdminLayout.tsx)
  adminUsers: User[];
  adminProducts: Product[];
  feedbacks: Feedback[];
  adminDataLoaded: boolean;

  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;

  activateProduct: (code: string) => Promise<{ ok: boolean; product?: any; error?: string }>;
  setupProfile: (data: any) => Promise<{ ok: boolean; error?: any }>;

  updateProfile: (productId: string, data: any) => Promise<{ ok: boolean; error?: any }>;
  updateTheme: (productId: string, theme: string) => Promise<void>;
  updateVisibility: (productId: string, visibility: 'public' | 'private' | 'hidden') => Promise<void>;

  getPublicProfile: (slug: string) => Promise<Product | undefined>;
  loadProducts: (userId: string) => Promise<void>;
  loadAdminData: () => Promise<void>;
  markNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  requestAccountDeletion: () => Promise<{ ok: boolean; error?: string }>;
  recordVisit: (productId: string, type?: 'nfc' | 'qr' | 'link', action?: string) => Promise<void>;

  // Admin actions
  adminCreateBatch: (type: ProductType, qty: number, loteName: string) => string[];
  adminBlockProduct: (productId: string) => Promise<void>;
}

const AuthContext = createContext<Ctx | undefined>(undefined);

const LOGIN_NOTIFS_KEY = 'airnect:login-notifications';

function readStoredLoginNotifs(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(`${LOGIN_NOTIFS_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredLoginNotifs(userId: string, notifs: AppNotification[]) {
  try {
    localStorage.setItem(`${LOGIN_NOTIFS_KEY}:${userId}`, JSON.stringify(notifs.slice(0, 20)));
  } catch {
    // localStorage indisponível (modo privado etc.) — falha silenciosa, não é crítico
  }
}

// ─── EXCLUSÃO PERMANENTE DE NOTIFICAÇÕES ─────────────────────────────────
// Notificações de "visita" são derivadas, a cada carregamento, da tabela
// `visits` (ver loadUserData). Isso significa que simplesmente removê-las do
// state não basta: no próximo F5/login elas reapareceriam recriadas a partir
// das mesmas visitas. Para que "excluir" seja de fato permanente, guardamos
// os ids excluídos localmente e filtramos qualquer notificação (de visita OU
// de login) cujo id já tenha sido descartado pelo usuário.
const DISMISSED_NOTIFS_KEY = 'airnect:dismissed-notifications';

function readDismissedIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${DISMISSED_NOTIFS_KEY}:${userId}`);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeDismissedIds(userId: string, ids: Set<string>) {
  try {
    // Mantém só os últimos 300 ids para não crescer indefinidamente.
    const arr = Array.from(ids).slice(-300);
    localStorage.setItem(`${DISMISSED_NOTIFS_KEY}:${userId}`, JSON.stringify(arr));
  } catch {
    // localStorage indisponível — falha silenciosa, não é crítico
  }
}

// ─── MARCADOR DE "JÁ NOTIFICADO NESTA ABA" ───────────────────────────────
// Por que sessionStorage e não um simples ref/estado em memória:
// a tentativa anterior guardava em uma variável local do useEffect ("é o
// primeiro evento que este listener recebe?"). Isso falha porque o
// Supabase pode disparar MAIS de um evento durante o boot de uma sessão já
// existente — por exemplo TOKEN_REFRESHED seguido de SIGNED_IN, ou
// INITIAL_SESSION seguido de SIGNED_IN — dependendo da versão do SDK e de
// quão perto do vencimento está o token no momento do F5. Contar "qual é o
// primeiro evento" não é confiável porque não dá pra saber de antemão
// quantos eventos o boot vai emitir nem em que ordem.
//
// sessionStorage resolve isso de forma independente da coreografia de
// eventos do Supabase: ele sobrevive a um F5 (mesma aba) mas é limpo quando
// a aba/janela é fechada. Guardamos "já notificamos o login deste usuário
// nesta aba" — não importa quantas vezes SIGNED_IN dispare depois de
// marcado, a notificação só é criada uma vez, até a aba fechar ou o
// usuário fazer logout (que limpa o marcador).
const SESSION_NOTIFIED_KEY = 'airnect:session-notified-user';

function hasNotifiedThisTabSession(userId: string): boolean {
  try {
    return sessionStorage.getItem(SESSION_NOTIFIED_KEY) === userId;
  } catch {
    // Sem acesso a sessionStorage: mais seguro assumir que já notificou
    // (evita ficar recriando notificação em loop) do que assumir que não.
    return true;
  }
}

function markTabSessionNotified(userId: string) {
  try {
    sessionStorage.setItem(SESSION_NOTIFIED_KEY, userId);
  } catch {
    // falha silenciosa — pior caso, volta a checar por evento
  }
}

function clearTabSessionNotified() {
  try {
    sessionStorage.removeItem(SESSION_NOTIFIED_KEY);
  } catch {
    // no-op
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const clearBlockedReason = useCallback(() => setBlockedReason(null), []);

  // ─── Bloqueio/suspensão de conta ────────────────────────────────────────
  // customer_profiles.status é o status COMERCIAL controlado pelo painel
  // admin. Como o client não tem a service_role key, não é possível banir a
  // sessão do Supabase Auth diretamente — mas podemos (e devemos) checar o
  // status a cada login/boot de sessão e encerrar a sessão do lado do
  // cliente assim que detectarmos Bloqueado/Suspenso, para que "Bloquear"/
  // "Suspender" no painel realmente impeça o uso do app, e não só mude um
  // rótulo cosmético.
  const checkAccountBlocked = useCallback(async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    if (data.status === 'Bloqueado') {
      return 'Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte AirNext para mais informações.';
    }
    if (data.status === 'Suspenso') {
      return 'Sua conta está suspensa no momento. Entre em contato com o suporte AirNext para regularizar.';
    }
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Só clientes (USER) têm status comercial em customer_profiles — admin
    // nunca é bloqueado por essa tabela. Checa ANTES de devolver o login
    // como bem-sucedido, para nunca deixar a tela navegar para o dashboard
    // e só depois "kickar" o usuário (evita o flash de conteúdo protegido).
    const role = data.user?.app_metadata?.role === 'ADMIN' ? 'ADMIN' : 'USER';
    if (role === 'USER' && data.user) {
      const reason = await checkAccountBlocked(data.user.id);
      if (reason) {
        await supabase.auth.signOut();
        const err: any = new Error(reason);
        err.blocked = true;
        throw err;
      }
    }
    return data;
  }, [checkAccountBlocked]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    });
    if (error) throw error;
    return data;
  }, []);

  // Login social com Google via Supabase Auth (OAuth). Basta habilitar o
  // provider "Google" no painel do Supabase (Authentication > Providers) e
  // configurar o Client ID/Secret do Google Cloud Console — nenhuma outra
  // mudança de código é necessária.
  //
  // redirectTo aponta para /login (não mais /dashboard fixo): a rota /login
  // é protegida pelo wrapper <Guest>, que já verifica o role da sessão e
  // manda ADMIN para /admin e USER para /dashboard automaticamente. Assim
  // o mesmo botão "Entrar com Google" funciona certo tanto pra clientes
  // quanto para admins, sem precisar saber o role de antemão (impossível,
  // já que nesse ponto o navegador ainda nem foi pro Google).
  const loginWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearTabSessionNotified();
    setUser(null); setAllProducts([]); setVisits([]); setNotifications([]); setHasProfile(null);
    setAdminUsers([]); setAdminProducts([]); setFeedbacks([]); setAdminDataLoaded(false);
  }, []);

  // ─── CARGA CONSOLIDADA ─────────────────────────────────────────────────
  // Antes eram 3 queries separadas a `products` (uma em loadProducts, uma em
  // loadVisits só para pegar ids, outra em loadNotifications) + 2 queries a
  // `visits` (uma para o estado de visitas, outra só para notificações) — e
  // tudo isso rodava 2x por causa do bug de boot duplicado (ver useEffect
  // mais abaixo). Agora é 1 query em `products` + 1 query em `visits`, com
  // as notificações de acesso derivadas do mesmo array de visitas já buscado.
  // Notificações enviadas manualmente (ou por gatilho) pelo admin ao cliente
  // — tabela `admin_notifications` (ver supabase/admin_panel.sql). Antes o
  // painel admin gravava aqui mas NADA no app do cliente lia essa tabela: a
  // notificação "enviada" só aparecia de volta no próprio painel admin, sem
  // nunca chegar ao cliente de fato. Buscamos aqui e mesclamos com as
  // notificações de acesso/login já existentes.
  const loadAdminNotifications = useCallback(async (userId: string): Promise<AppNotification[]> => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, title, message, channel, sent_at, opened_at')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(100);
    if (error || !data) {
      if (error) console.error('Falha ao carregar notificações do admin:', error);
      return [];
    }
    return data.map((n: any): AppNotification => ({
      id: n.id,
      type: 'admin',
      title: n.title,
      message: n.message,
      read: !!n.opened_at,
      createdAt: n.sent_at,
      origin: n.channel,
    }));
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const { data: prods, error: prodErr } = await supabase
      .from('products')
      .select('id, code, user_id, status, activated_at, expires_at, created_at, category, slug, theme, visibility, lote_name, product_type, profile_data, media_carousel, stats')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const dismissed = readDismissedIds(userId);
    const adminNotifs = await loadAdminNotifications(userId);

    if (prodErr || !prods) {
      setAllProducts([]); setHasProfile(false); setVisits([]);
      const merged = [...readStoredLoginNotifs(userId), ...adminNotifs]
        .filter(n => !dismissed.has(n.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(merged);
      return;
    }

    const mapped = prods.map(mapProduct);
    setAllProducts(mapped);
    setHasProfile(mapped.length > 0);

    if (!prods.length) {
      setVisits([]);
      const merged = [...readStoredLoginNotifs(userId), ...adminNotifs]
        .filter(n => !dismissed.has(n.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(merged);
      return;
    }

    const ids = prods.map((p: any) => p.id);

    const { data: visitRows, error: visitErr } = await supabase
      .from('visits')
      .select('id, product_id, type, action, city, device, created_at')
      .in('product_id', ids)
      .order('created_at', { ascending: false })
      .limit(500);

    if (visitErr || !visitRows) {
      console.error('Falha ao carregar visitas:', visitErr);
      setVisits([]);
      const merged = [...readStoredLoginNotifs(userId), ...adminNotifs]
        .filter(n => !dismissed.has(n.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(merged);
      return;
    }

    const mappedVisits: Visit[] = visitRows.map((v: any) => ({
      id: v.id, productId: v.product_id ?? '', type: v.type ?? 'link',
      action: v.action, city: v.city ?? '', device: v.device ?? '',
      createdAt: v.created_at ?? '',
    }));
    setVisits(mappedVisits);

    // Notificações de acesso derivadas do MESMO array acima — antes era uma
    // 3ª query separada em `visits` (limit 30) dentro de loadNotifications.
    const visitNotifs: AppNotification[] = mappedVisits.slice(0, 30).map(v => {
      const prod = prods.find((p: any) => p.id === v.productId);
      const name = prod?.profile_data?.nome || prod?.profile_data?.nomeEmpresa || 'seu perfil';
      return {
        id: v.id, type: 'visit',
        message: `Novo acesso em "${name}"`,
        productId: v.productId, productName: name,
        read: false, createdAt: v.createdAt,
      };
    });

    const loginNotifs = readStoredLoginNotifs(userId);
    const merged = [...loginNotifs, ...visitNotifs, ...adminNotifs]
      .filter(n => !dismissed.has(n.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(merged);
  }, [loadAdminNotifications]);

  // Mantido por compatibilidade: telas como Onboarding.tsx chamam
  // loadProducts(userId) para recarregar tudo após uma ação pontual.
  const loadProducts = useCallback(async (userId: string) => {
    await loadUserData(userId);
  }, [loadUserData]);

  // Intervalo mínimo entre duas notificações de login do MESMO usuário.
  // Isso não é "o fix" (a causa raiz é corrigida no listener de auth, mais
  // abaixo) — é uma trava defensiva contra corrida: se por qualquer motivo
  // (ex: dois listeners de auth ativos ao mesmo tempo, uma aba duplicada,
  // um StrictMode mal comportado em algum ambiente) esta função for chamada
  // duas vezes quase ao mesmo tempo, a segunda chamada não grava uma
  // segunda notificação por cima.
  const LOGIN_NOTIF_DEDUPE_WINDOW_MS = 5000;

  const recordLoginNotification = useCallback((u: User, origin?: string) => {
    const existing = readStoredLoginNotifs(u.id);

    const lastLogin = existing.find(n => n.type === 'login');
    if (lastLogin && Date.now() - new Date(lastLogin.createdAt).getTime() < LOGIN_NOTIF_DEDUPE_WINDOW_MS) {
      // Já existe uma notificação de login bem recente para este usuário —
      // trata como o mesmo evento, não cria outra.
      return lastLogin;
    }

    const notif: AppNotification = {
      id: `login-${u.id}-${Date.now()}`,
      type: 'login',
      message: `Novo login de ${u.name || u.email}`,
      userId: u.id,
      userName: u.name,
      origin,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [notif, ...existing].slice(0, 20);
    writeStoredLoginNotifs(u.id, updated);
    setNotifications(prev => {
      // Dedupe defensivo por id — nunca insere a mesma notificação 2x no
      // state, mesmo que esta função seja chamada em rápida sucessão.
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
    return notif;
  }, []);

  // ─── ADMIN: dados de toda a plataforma, carregados sob demanda ─────────
  // Antes rodava incondicionalmente em TODO login/refresh de qualquer admin
  // (e dobrado pelo bug de boot). Agora só é chamado quando o admin entra em
  // /admin (ver AdminLayout.tsx), e só uma vez por sessão (adminDataLoaded).
  const loadAdminData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        // profile_data e media_carousel removidos: as telas de admin
        // (AdminHome/Clients) nunca leem esses campos, que costumam ser os
        // mais pesados da tabela — e aqui é a tabela inteira, todos os donos.
        .select('id, code, user_id, status, activated_at, expires_at, created_at, category, slug, theme, visibility, lote_name, product_type')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAdminProducts((data ?? []).map(mapProduct));
    } catch (err) {
      console.error('Falha ao carregar produtos (admin):', err);
      setAdminProducts([]);
    }

    // Listagem de usuários via `profiles` (dedupe por user_id) — não há
    // forma client-safe de listar usuários do Supabase Auth diretamente.
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email, created_at');
      if (error) throw error;
      const seen = new Set<string>();
      const users: User[] = [];
      for (const row of data ?? []) {
        if (!row.user_id || seen.has(row.user_id)) continue;
        seen.add(row.user_id);
        users.push({
          id: row.user_id,
          name: row.name || '—',
          email: row.email || '',
          role: 'USER',
          createdAt: (row.created_at || '').slice(0, 10),
        });
      }
      setAdminUsers(users);
    } catch (err) {
      console.error('Falha ao carregar clientes (admin):', err);
      setAdminUsers([]);
    }

    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks((data ?? []).map((row: any): Feedback => ({
        id: row.id,
        userId: row.user_id ?? '',
        userName: row.user_name ?? row.userName ?? '',
        userEmail: row.user_email ?? row.userEmail ?? '',
        experience: row.experience ?? '',
        improvement: row.improvement ?? '',
        navigation: row.navigation ?? '',
        comments: row.comments ?? '',
        createdAt: row.created_at ?? '',
      })));
    } catch (err) {
      console.error('Falha ao carregar feedbacks (admin):', err);
      setFeedbacks([]);
    }

    setAdminDataLoaded(true);
  }, []);

  // Formato OFICIAL do código de ativação em todo o sistema: "AIR-" + 8
  // caracteres, um único traço, 12 caracteres no total. Precisa ser
  // idêntico ao gerador real usado pelo painel novo (ver
  // src/lib/adminUtils.ts generateActivationCode) para não gerar códigos
  // que não cabem/batem no campo de digitação da Ativação de Produto.
  const generateActivationCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos (0/O, 1/I/L)
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `AIR-${s}`;
  };

  const adminCreateBatch = useCallback((type: ProductType, qty: number, loteName: string): string[] => {
    const codes = Array.from({ length: Math.max(1, qty) }, generateActivationCode);
    (async () => {
      const rows = codes.map(code => ({
        code,
        product_type: type,
        status: 'DISPONIVEL',
        lote_name: loteName,
        created_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('products').insert(rows);
      if (error) {
        console.error('Falha ao gerar lote de códigos:', error);
        return;
      }
      await loadAdminData();
    })();
    return codes;
  }, [loadAdminData]);

  const adminBlockProduct = useCallback(async (productId: string) => {
    const { error } = await supabase.from('products').update({ status: 'BLOQUEADO' }).eq('id', productId);
    if (error) { console.error('Falha ao bloquear produto:', error); return; }
    setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'BLOQUEADO' } : p));
  }, []);

  const activateProduct = useCallback(async (code: string) => {
    if (!user) return { ok: false, error: 'Usuário não autenticado' };
    const cleanCode = code.trim().replace(/\s+/g, '').toUpperCase();
    const { data, error } = await supabase.from('products').select('*').eq('code', cleanCode);
    const product = data?.[0];
    if (error || !product) return { ok: false, error: 'Código inválido ou não encontrado' };
    if (product.status !== 'DISPONIVEL') {
      if (product.user_id === user.id) return { ok: false, error: 'Este produto já está ativado na sua conta' };
      return { ok: false, error: 'Código já utilizado' };
    }
    const { error: updateError } = await supabase.from('products').update({
      user_id: user.id, status: 'ATIVO', activated_at: new Date().toISOString(),
    }).eq('id', product.id);
    if (updateError) return { ok: false, error: updateError.message };
    await loadUserData(user.id);
    return { ok: true, product };
  }, [user, loadUserData]);

  const setupProfile = useCallback(async (data: any) => {
    if (!user) return { ok: false, error: 'Usuário não autenticado' };
    const { product_id, category, profile_data, slug, theme, visibility } = data;
    if (!product_id) return { ok: false, error: 'product_id é obrigatório' };

    // products é a fonte oficial: category, profile_data, slug, theme e
    // visibility precisam ser gravados aqui, sempre filtrando pelo produto
    // recém ativado (nunca em outro produto da mesma conta).
    const productPayload: any = { updated_at: new Date().toISOString() };
    if (category !== undefined) productPayload.category = category;
    if (profile_data !== undefined) productPayload.profile_data = profile_data;
    if (slug !== undefined) productPayload.slug = slug;
    if (theme !== undefined) productPayload.theme = theme;
    if (visibility !== undefined) productPayload.visibility = visibility;

    const { error: productError } = await supabase
      .from('products')
      .update(productPayload)
      .eq('id', product_id)
      .eq('user_id', user.id);

    if (productError) return { ok: false, error: productError };

    // profiles, quando usada, fica apenas sincronizada — products continua
    // sendo a fonte oficial lida pelo Dashboard/Editor/Analytics/páginas públicas.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          product_id,
          profile_type: category,
          name: profile_data?.nome || profile_data?.nomeEmpresa || '',
          bio: profile_data?.bio || '',
          public_slug: slug,
          email: user.email,
          visible: visibility ? visibility === 'public' : true,
        }, { 
          onConflict: 'user_id' 
        });

      if (profileError) {
        console.error('Falha ao sincronizar profiles:', profileError);
      }

    // Recarrega products para garantir que o estado React não fique
    // desatualizado (ação pontual, uma vez por ativação — refetch aqui é ok).
    await loadUserData(user.id);
    return { ok: true, error: undefined };
  }, [user, loadUserData]);

  const updateProfile = useCallback(async (productId: string, data: any) => {
    const { mediaCarousel, ...profileData } = data;
    const payload: any = { profile_data: profileData, updated_at: new Date().toISOString() };
    if (mediaCarousel !== undefined) payload.media_carousel = mediaCarousel;

    // Sem .select() no update: o retorno não era usado, só somava payload.
    const { error } = await supabase.from('products').update(payload).eq('id', productId);
    if (error) { console.error('Falha ao atualizar perfil:', error); return { ok: false, error }; }

    // Optimistic update local — sem refetch completo de `products` depois
    // (antes: optimistic update E loadProducts(user.id) no mesmo clique).
    setAllProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return { ...p, profileData, mediaCarousel: mediaCarousel ?? p.mediaCarousel };
    }));
    return { ok: true, error: undefined };
  }, []);

  const updateTheme = useCallback(async (productId: string, theme: string) => {
    const { error } = await supabase.from('products').update({ theme }).eq('id', productId);
    if (error) { console.error('Falha ao atualizar tema:', error); return; }
    setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, theme } : p));
  }, []);

  const updateVisibility = useCallback(async (productId: string, visibility: 'public' | 'private' | 'hidden') => {
    const { error } = await supabase.from('products').update({ visibility }).eq('id', productId);
    if (error) { console.error('Falha ao atualizar visibilidade:', error); return; }
    setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, visibility } : p));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (user) {
        const loginOnes = updated.filter(n => n.type === 'login');
        writeStoredLoginNotifs(user.id, loginOnes);

        // Marca também no banco as notificações do admin ainda não abertas,
        // para refletir "Aberto" de volta no painel administrativo.
        const unopenedAdminIds = prev.filter(n => n.type === 'admin' && !n.read).map(n => n.id);
        if (unopenedAdminIds.length > 0) {
          const now = new Date().toISOString();
          supabase
            .from('admin_notifications')
            .update({ opened_at: now, status: 'Aberto' })
            .in('id', unopenedAdminIds)
            .eq('user_id', user.id)
            .then(({ error }) => {
              if (error) console.error('Falha ao marcar notificação como aberta:', error);
            });
        }
      }
      return updated;
    });
  }, [user]);

  // Exclui UMA notificação permanentemente. Como notificações de visita são
  // recalculadas a partir da tabela `visits` a cada carregamento, marcamos o
  // id como "descartado" localmente para que ele nunca mais seja
  // reinserido — sem isso a notificação "ressuscitaria" no próximo refresh.
  const deleteNotification = useCallback((id: string) => {
    if (!user) return;
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      const loginOnes = updated.filter(n => n.type === 'login');
      writeStoredLoginNotifs(user.id, loginOnes);
      return updated;
    });
    const dismissed = readDismissedIds(user.id);
    dismissed.add(id);
    writeDismissedIds(user.id, dismissed);
  }, [user]);

  // Limpa TODAS as notificações permanentemente (mesmo raciocínio acima,
  // mas para a lista inteira de uma vez).
  const clearAllNotifications = useCallback(() => {
    if (!user) return;
    setNotifications(prev => {
      const dismissed = readDismissedIds(user.id);
      prev.forEach(n => dismissed.add(n.id));
      writeDismissedIds(user.id, dismissed);
      return [];
    });
    writeStoredLoginNotifs(user.id, []);
  }, [user]);

  const requestAccountDeletion = useCallback(async () => {
    if (!user) {
      return { ok: false, error: 'Não autenticado' };
    }

    try {
      const { error } = await supabase
        .from('deletion_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          requested_at: new Date().toISOString(),
          status: 'pending',
        });

      if (error) {
        console.error('Erro ao criar solicitação:', error);
        return { ok: false, error: error.message };
      }

      await logout();

      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Erro desconhecido',
      };
    }
  }, [user, logout]);

  // ─── BOOT DE AUTH: fonte única, sem duplicar a carga ───────────────────
  // Antes: um init() manual chamava getSession() e disparava a carga
  // completa, e o onAuthStateChange (que o Supabase JS v2 dispara IMEDIATA-
  // MENTE ao se inscrever) disparava a MESMA carga completa de novo —
  // dobrando toda query de boot em todo login, F5 ou reabertura de aba.
  // Agora existe um único handler.
  //
  // ─── CAUSA RAIZ DA NOTIFICAÇÃO DE LOGIN DUPLICADA NO F5 (v2) ───────────
  // Uma primeira tentativa de correção assumia que "o primeiro evento
  // recebido pelo listener após se inscrever" era sempre a restauração de
  // sessão, e qualquer SIGNED_IN posterior seria um login de fato. Isso não
  // é suficiente: durante o boot de uma sessão já existente, o Supabase pode
  // emitir MAIS de um evento antes de estabilizar — por exemplo um
  // TOKEN_REFRESHED (quando o token salvo está perto de expirar e é
  // renovado automaticamente ao carregar a página) seguido de um SIGNED_IN,
  // ou um INITIAL_SESSION seguido de um SIGNED_IN "extra" — dependendo da
  // versão do SDK e de há quanto tempo o token foi emitido. Contar "qual é
  // o primeiro evento" não é confiável porque o número e a ordem dos
  // eventos no boot não são garantidos.
  //
  // A correção definitiva não depende de contar ou nomear eventos: usamos
  // um marcador em sessionStorage (`hasNotifiedThisTabSession`) que diz
  // "esta aba já notificou o login deste usuário". sessionStorage sobrevive
  // a um F5 (mesma aba/documento) e só é limpo quando a aba fecha ou no
  // logout. Não importa quantos SIGNED_IN cheguem depois de marcado — a
  // notificação só é criada uma vez, até a aba fechar ou o usuário deslogar.
  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (import.meta.env.DEV) {
        // Ajuda a diagnosticar no console quais eventos o Supabase está
        // realmente disparando no boot, caso precise investigar de novo.
        console.debug('[AuthContext] onAuthStateChange:', event, session?.user?.id ?? null);
      }

      if (!session?.user) {
        setUser(null); setAllProducts([]); setVisits([]); setNotifications([]); setHasProfile(null);
        setAdminUsers([]); setAdminProducts([]); setFeedbacks([]); setAdminDataLoaded(false);
        setLoading(false);
        return;
      }

      const u: User = {
        id: session.user.id,
        name: session.user.user_metadata?.name || '',
        email: session.user.email || '',
        role: session.user.app_metadata?.role === 'ADMIN' ? 'ADMIN' : 'USER',
        createdAt: session.user.created_at.slice(0, 10),
      };

      // Cobre login social (Google) e restauração de sessão existente (F5),
      // casos que não passam pela checagem síncrona feita em login(). Sem
      // isso, um cliente bloqueado DEPOIS de já estar logado continuaria
      // usando o app normalmente até fazer logout manual.
      if (u.role === 'USER') {
        const reason = await checkAccountBlocked(u.id);
        if (cancelled) return;
        if (reason) {
          await supabase.auth.signOut();
          clearTabSessionNotified();
          setUser(null); setAllProducts([]); setVisits([]); setNotifications([]); setHasProfile(null);
          setAdminUsers([]); setAdminProducts([]); setFeedbacks([]); setAdminDataLoaded(false);
          setBlockedReason(reason);
          setLoading(false);
          return;
        }
      }

      setUser(u);

      await loadUserData(u.id);
      // loadAdminData NÃO roda mais aqui — é carregado sob demanda quando o
      // admin efetivamente entra em /admin (ver AdminLayout.tsx).

      // Só registra "novo login" quando o evento é SIGNED_IN E esta aba
      // ainda não notificou este usuário. O marcador é setado assim que a
      // primeira notificação é criada, então qualquer SIGNED_IN adicional
      // disparado pelo Supabase durante o mesmo boot (ou num F5 seguinte)
      // é ignorado — sem depender de contar eventos.
      if (event === 'SIGNED_IN' && !hasNotifiedThisTabSession(u.id)) {
        recordLoginNotification(u, typeof window !== 'undefined' ? window.location.pathname : undefined);
        markTabSessionNotified(u.id);
      }

      setLoading(false);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [loadUserData, recordLoginNotification, checkAccountBlocked]);


  // ─── Realtime filtrado no servidor ──────────────────────────────────────
  // Antes: o canal escutava TODO insert na tabela `visits` (de QUALQUER
  // usuário da plataforma) e, para cada evento, disparava uma query extra a
  // `products` só para descobrir se a visita era deste usuário. Agora o
  // filtro roda no servidor (Realtime só entrega o que é do usuário) e o
  // produto já vem do estado local — zero query extra por evento.
  useEffect(() => {
    if (!user || allProducts.length === 0) return;
    const ids = allProducts.map(p => p.id);

    const channel = supabase
      .channel(`visits-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visits',
          filter: `product_id=in.(${ids.join(',')})`,
        },
        (payload: any) => {
          const productId = payload.new?.product_id;
          if (!productId) return;
          const prod = allProducts.find(p => p.id === productId);
          if (!prod) return; // segurança extra, não deveria acontecer com o filter acima
          const name = prod.profileData?.nome || prod.profileData?.nomeEmpresa || 'seu perfil';
          const notif: AppNotification = {
            id: payload.new.id,
            type: 'visit',
            message: `Novo acesso em "${name}"`,
            productId,
            productName: name,
            read: false,
            createdAt: payload.new.created_at || new Date().toISOString(),
          };
          setNotifications(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, allProducts]);

  // ─── Notificações do admin em tempo real ────────────────────────────────
  // Sem isto, uma notificação enviada pelo painel admin só apareceria para
  // o cliente no próximo F5/login (loadUserData). Com o canal abaixo ela
  // chega instantaneamente, igual às notificações de acesso.
  useEffect(() => {
    if (!user) return;
    const dismissed = readDismissedIds(user.id);

    const channel = supabase
      .channel(`admin-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (dismissed.has(payload.new.id)) return;
          const notif: AppNotification = {
            id: payload.new.id,
            type: 'admin',
            title: payload.new.title,
            message: payload.new.message,
            origin: payload.new.channel,
            read: false,
            createdAt: payload.new.sent_at || new Date().toISOString(),
          };
          setNotifications(prev => (prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const value = useMemo<Ctx>(() => ({
    user, products: allProducts, allProducts, visits, notifications, unreadCount,
    loading, hasProfile, adminUsers, adminProducts, feedbacks, adminDataLoaded,
    blockedReason, clearBlockedReason,
    login, register, loginWithGoogle, logout, activateProduct, setupProfile,
    updateProfile, updateTheme, updateVisibility, getPublicProfile, loadProducts, loadAdminData,
    markNotificationsRead, deleteNotification, clearAllNotifications, requestAccountDeletion, recordVisit,
    adminCreateBatch, adminBlockProduct,
  }), [
    user, allProducts, visits, notifications, unreadCount, loading, hasProfile,
    adminUsers, adminProducts, feedbacks, adminDataLoaded, blockedReason, clearBlockedReason,
    login, register, loginWithGoogle, logout, activateProduct, setupProfile, updateProfile,
    updateTheme, updateVisibility, loadProducts, loadAdminData,
    markNotificationsRead, deleteNotification, clearAllNotifications, requestAccountDeletion,
    adminCreateBatch, adminBlockProduct,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth fora do AuthProvider');
  return context;
}
