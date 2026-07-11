import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna bytes criptograficamente aleatórios, usando a Web Crypto API
 * quando disponível (recomendado) e um fallback apenas para ambientes
 * sem suporte (nunca deve ocorrer em navegadores modernos).
 */
function secureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * Gera um UUID v4 criptograficamente seguro. Usa crypto.randomUUID quando
 * disponível (Chrome/Edge/Firefox/Safari modernos) e um fallback seguro
 * baseado em crypto.getRandomValues caso contrário.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = secureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Gera o código de ativação oficial da AirNext.
 *
 * Formato FIXO e único em todo o sistema: "AIR-" + 8 caracteres, um único
 * traço no total, 12 caracteres no total (ex.: AIR-7F3K9QZP).
 * Alfabeto sem caracteres ambíguos (sem 0/O, 1/I/L) para reduzir erros de
 * digitação. Curto o suficiente pra digitar fácil no celular, mas com
 * ~40 bits de entropia — impossível de adivinhar por força bruta.
 *
 * IMPORTANTE: qualquer outro lugar do sistema que gere ou valide o formato
 * do código de ativação (ActivationPage, SupportPage, AuthContext) precisa
 * respeitar exatamente este mesmo formato, ou os códigos reais gerados
 * aqui não caberão/baterão nos campos de digitação do cliente.
 */
export function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 32 caracteres, sem ambiguidade
  const length = 8; // "AIR-" (4) + 8 = 12 caracteres totais, um único traço
  const bytes = secureRandomBytes(length);
  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return `AIR-${suffix}`;
}

/**
 * Gera um código interno único combinando prefixo, timestamp em base36 e
 * um sufixo aleatório — evitando colisões mesmo em criações concorrentes,
 * ao contrário de um contador sequencial simples.
 */
export function generateInternalCode(prefix: string, index: number): string {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Array.from(secureRandomBytes(3), (b) => b.toString(36))
    .join('')
    .toUpperCase()
    .slice(0, 4);
  const sequencePart = String(index).padStart(4, '0');
  return `${prefix}-${timestampPart}${randomPart}-${sequencePart}`;
}

/**
 * Gera um valor único (UUID, código de ativação, etc.) garantindo que não
 * exista colisão com um conjunto de valores já utilizados. Essencial para
 * lotes grandes, onde a chance de colisão — embora estatisticamente
 * desprezível — deve ser eliminada por completo.
 */
export function generateUnique(generator: () => string, existing: Set<string>): string {
  let value = generator();
  let attempts = 0;
  while (existing.has(value) && attempts < 50) {
    value = generator();
    attempts++;
  }
  existing.add(value);
  return value;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function differenceInDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((a.getTime() - b.getTime()) / msPerDay);
}

export function getValidityStatus(days: number | undefined): {
  label: string;
  color: string;
  bg: string;
  text: string;
} {
  if (days === undefined) return { label: 'Não ativado', color: 'bg-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-400' };
  if (days <= 0) return { label: 'Expirado', color: 'bg-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-400' };
  if (days <= 30) return { label: days === 30 ? '30 dias' : 'Crítico', color: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' };
  if (days <= 90) return { label: days === 90 ? '90 dias' : 'Urgente', color: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' };
  if (days <= 180) return { label: 'Expirando', color: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' };
  return { label: 'Ativo', color: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
}

export function getProductStatus(product: { activatedAt?: string; expiresAt?: string; status?: string }): string {
  if (product.status && product.status !== 'Ativado' && product.status !== 'Disponível para ativação' && product.status !== 'Programado') return product.status;
  if (!product.activatedAt) return product.status || 'Não ativado';
  if (!product.expiresAt) return 'Ativado';
  const days = differenceInDays(new Date(product.expiresAt), new Date());
  if (days <= 0) return 'Expirado';
  if (days <= 180) return 'Expirando';
  return 'Ativado';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function exportCSV(filename: string, rows: Record<string, string | number | boolean | undefined>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = row[h] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(';')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
