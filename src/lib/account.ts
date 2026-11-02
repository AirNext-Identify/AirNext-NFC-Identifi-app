import type { User } from '../types/user';

/**
 * Dados da conta do cliente (nome, sobrenome, telefone, idade, quem gerencia).
 * Ficam em `auth.users.user_metadata` do Supabase — não exige migração de banco.
 */

export const MANAGER_OPTIONS = [
  { id: 'self', label: 'Eu mesmo(a)', hint: 'Eu administro meus perfis' },
  { id: 'guardian', label: 'Meu responsável legal', hint: 'Pai, mãe ou tutor legal administra' },
  { id: 'family', label: 'Familiar ou cuidador', hint: 'Alguém da família cuida por mim' },
  { id: 'company', label: 'Minha empresa ou equipe', hint: 'Um time administra os perfis' },
  { id: 'other', label: 'Outra pessoa', hint: 'Outra pessoa de confiança' },
] as const;

export type ManagedBy = (typeof MANAGER_OPTIONS)[number]['id'];

export const managerLabel = (id?: string) =>
  MANAGER_OPTIONS.find(o => o.id === id)?.label || 'Eu mesmo(a)';

export const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

/** Máscara brasileira: (47) 99628-7761 / (47) 3333-4444. Aceita colar com +55. */
export function maskPhone(raw: string): string {
  let d = onlyDigits(raw);
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function isValidPhone(raw: string): boolean {
  const d = onlyDigits(raw);
  return d.length === 10 || d.length === 11;
}

/** Idade é opcional. Retorna null se vazia; NaN-safe; limita a 0–120. */
export function parseAge(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 0 || n > 120) return null;
  return n;
}

export const isMinor = (age: number | null | undefined) => typeof age === 'number' && age < 18;

export function splitFullName(full: string): { first: string; last: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/** Lê os dados da conta a partir do user_metadata do Supabase (login normal ou Google). */
export function accountFromMetadata(meta: Record<string, any> | undefined | null) {
  const m = meta || {};
  const fullName: string = m.name || m.full_name || '';
  const split = splitFullName(fullName);
  const firstName: string = m.first_name || split.first;
  const lastName: string = m.last_name ?? split.last;
  const age = parseAge(m.age);
  return {
    name: [firstName, lastName].filter(Boolean).join(' ') || fullName,
    firstName,
    lastName,
    phone: onlyDigits(m.phone || ''),
    age,
    managedBy: (m.managed_by as string) || 'self',
    managerName: (m.manager_name as string) || '',
  };
}

export interface AccountInput {
  firstName: string;
  lastName: string;
  phone: string;
  age: number | null;
  managedBy: string;
  managerName: string;
}

/** Converte o formulário em user_metadata (usado no signUp e no updateUser). */
export function accountToMetadata(a: AccountInput) {
  const first = a.firstName.trim();
  const last = a.lastName.trim();
  return {
    name: [first, last].filter(Boolean).join(' '),
    first_name: first,
    last_name: last,
    phone: onlyDigits(a.phone),
    age: a.age,
    managed_by: a.managedBy || 'self',
    manager_name: a.managedBy && a.managedBy !== 'self' ? a.managerName.trim() : '',
  };
}

/** Cadastro "completo" = nome, sobrenome e telefone válidos (idade é opcional). */
export function isAccountComplete(u: Pick<User, 'firstName' | 'lastName' | 'phone'> | null | undefined): boolean {
  return !!(u && u.firstName?.trim() && u.lastName?.trim() && isValidPhone(u.phone || ''));
}
