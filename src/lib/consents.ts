import { supabase } from './supabase';
import { DOCUMENT_VERSIONS, type DocumentType } from '../config/legal';

export type ConsentType = DocumentType | 'marketing';

export const REQUIRED_CONSENT_TYPES: DocumentType[] = ['privacy_policy', 'terms_of_use'];

export interface UserConsent {
  id?: string;
  user_id: string;
  document_type: ConsentType;
  document_version: string;
  accepted: boolean;
  accepted_at: string;
  ip_hint?: string | null;
  user_agent?: string | null;
}

export interface ConsentStatus {
  /** true quando privacidade + termos estão na versão atual e aceitos */
  requiredOk: boolean;
  privacyOk: boolean;
  termsOk: boolean;
  marketingAccepted: boolean;
  versions: {
    privacy_policy: string | null;
    terms_of_use: string | null;
    marketing: string | null;
  };
  /** true enquanto a checagem ainda não terminou */
  loading: boolean;
}

export const EMPTY_CONSENT_STATUS: ConsentStatus = {
  requiredOk: false,
  privacyOk: false,
  termsOk: false,
  marketingAccepted: false,
  versions: { privacy_policy: null, terms_of_use: null, marketing: null },
  loading: true,
};

function readLocalConsents(userId: string): UserConsent[] {
  try {
    const key = `airnext:consents:${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeLocalConsents(userId: string, rows: object[]) {
  try {
    const key = `airnext:consents:${userId}`;
    const prev = readLocalConsents(userId);
    localStorage.setItem(key, JSON.stringify([...prev, ...rows]));
  } catch {
    /* ignore */
  }
}

function latestVersionsFromRows(
  rows: { document_type: string; document_version: string; accepted: boolean }[]
): Record<string, string> {
  const latest: Record<string, string> = {};
  for (const row of rows) {
    if (!row.accepted) continue;
    if (!latest[row.document_type]) latest[row.document_type] = row.document_version;
  }
  return latest;
}

function statusFromVersions(latest: Record<string, string>): Omit<ConsentStatus, 'loading'> {
  const privacyOk = latest.privacy_policy === DOCUMENT_VERSIONS.privacy_policy;
  const termsOk = latest.terms_of_use === DOCUMENT_VERSIONS.terms_of_use;
  return {
    requiredOk: privacyOk && termsOk,
    privacyOk,
    termsOk,
    marketingAccepted: !!latest.marketing,
    versions: {
      privacy_policy: latest.privacy_policy || null,
      terms_of_use: latest.terms_of_use || null,
      marketing: latest.marketing || null,
    },
  };
}

/**
 * Status detalhado dos consentimentos do usuário (versão atual vs registrada).
 */
export async function getConsentStatus(userId: string): Promise<ConsentStatus> {
  if (!userId) return { ...EMPTY_CONSENT_STATUS, loading: false };

  try {
    const { data, error } = await supabase
      .from('user_consents')
      .select('document_type, document_version, accepted, accepted_at')
      .eq('user_id', userId)
      .eq('accepted', true)
      .order('accepted_at', { ascending: false });

    // 403/42501 = RLS ou tabela sem grant — cai no fallback local sem quebrar a UI
    if (error) {
      if (import.meta.env.DEV) {
        console.debug('[consents] remote read unavailable, using local fallback:', error.message);
      }
      throw error;
    }

    const latest = latestVersionsFromRows(data || []);
    return { ...statusFromVersions(latest), loading: false };
  } catch {
    const rows = readLocalConsents(userId);
    const latest = latestVersionsFromRows([...rows].reverse());
    return { ...statusFromVersions(latest), loading: false };
  }
}

/**
 * Registra consentimentos no Supabase (tabela `user_consents`).
 * SQL em src/sql/user_consents.sql
 */
export async function recordConsents(
  userId: string,
  items: { type: ConsentType; accepted: boolean; version?: string }[]
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || items.length === 0) return { ok: false, error: 'Dados inválidos' };

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null;
  const rows = items.map((item) => ({
    user_id: userId,
    document_type: item.type,
    document_version:
      item.version ||
      (item.type === 'marketing'
        ? DOCUMENT_VERSIONS.privacy_policy
        : DOCUMENT_VERSIONS[item.type as DocumentType] || '1.0'),
    accepted: item.accepted,
    accepted_at: new Date().toISOString(),
    user_agent: ua,
  }));

  const { error } = await supabase.from('user_consents').insert(rows);
  if (error) {
    console.warn('[consents] insert failed, storing local fallback:', error.message);
    writeLocalConsents(userId, rows);
    return { ok: true };
  }
  // Espelha no local para leitura rápida e fallback offline
  writeLocalConsents(userId, rows);
  return { ok: true };
}

/** Atalho: verifica apenas se os obrigatórios da versão atual estão ok. */
export async function hasCurrentRequiredConsents(userId: string): Promise<boolean> {
  const status = await getConsentStatus(userId);
  return status.requiredOk;
}

const PENDING_KEY = 'airnext:pending_consents';

export type PendingConsentsPayload = {
  privacy: boolean;
  terms: boolean;
  marketing: boolean;
  at: number;
};

/** Lê consentimentos pendentes gravados antes do redirect OAuth (Google). */
export function readPendingConsents(): PendingConsentsPayload | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingConsentsPayload;
    // Descarta se tiver mais de 2h (evita lixo de sessões antigas)
    if (!parsed?.at || Date.now() - parsed.at > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingConsents() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Após login (ex.: Google OAuth), grava no backend os aceites que o usuário
 * marcou na tela de cadastro antes do redirect.
 */
export async function flushPendingConsents(userId: string): Promise<ConsentStatus | null> {
  const pending = readPendingConsents();
  if (!pending || !userId) return null;
  if (!pending.privacy || !pending.terms) {
    clearPendingConsents();
    return null;
  }

  await recordConsents(userId, [
    { type: 'privacy_policy', accepted: true },
    { type: 'terms_of_use', accepted: true },
    { type: 'marketing', accepted: !!pending.marketing },
  ]);
  clearPendingConsents();
  return getConsentStatus(userId);
}

/** Aceite obrigatório (e marketing opcional) na versão atual dos documentos. */
export async function acceptRequiredConsents(
  userId: string,
  opts?: { marketing?: boolean }
): Promise<{ ok: boolean; status?: ConsentStatus; error?: string }> {
  const res = await recordConsents(userId, [
    { type: 'privacy_policy', accepted: true },
    { type: 'terms_of_use', accepted: true },
    { type: 'marketing', accepted: !!opts?.marketing },
  ]);
  if (!res.ok) return res;
  const status = await getConsentStatus(userId);
  return { ok: true, status };
}
