export interface User {
  id: string;
  /** Nome completo (nome + sobrenome) — mantido por compatibilidade com o resto do app. */
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  /** Primeiro nome (guardado em user_metadata.first_name). */
  firstName?: string;
  /** Sobrenome (user_metadata.last_name). */
  lastName?: string;
  /** Telefone/WhatsApp só com dígitos, ex.: 47996287761. */
  phone?: string;
  /** Idade em anos (opcional). */
  age?: number | null;
  /** Quem gerencia a conta: ver MANAGER_OPTIONS em lib/account.ts. */
  managedBy?: string;
  /** Nome de quem gerencia, quando não é o próprio titular. */
  managerName?: string;
}
