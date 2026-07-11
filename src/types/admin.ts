export type PlanType = 'Starter' | 'Pro' | 'Business' | 'Enterprise';

/** Corresponde 1:1 a `products.product_type` no Supabase real. */
export type ProductType = 'CARTAO' | 'PULSEIRA' | 'CHAVEIRO' | 'PLAQUINHA_PET' | 'ETIQUETA' | undefined;

export const PRODUCT_TYPE_LABELS: Record<Exclude<ProductType, undefined>, string> = {
  CARTAO: 'Cartão',
  PULSEIRA: 'Pulseira',
  CHAVEIRO: 'Chaveiro',
  PLAQUINHA_PET: 'Plaquinha Pet',
  ETIQUETA: 'Etiqueta',
};

export type ProductStatus =
  | 'Não programado'
  | 'Não ativado'
  | 'Disponível para ativação'
  | 'Programado'
  | 'Ativado'
  | 'Expirando'
  | 'Expirado'
  | 'Renovado'
  | 'Bloqueado'
  | 'Cancelado';

export type CustomerStatus = 'Ativo' | 'Bloqueado' | 'Suspenso' | 'Inativo';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  document: string;
  address: Address;
  plan: PlanType;
  planValue: number;
  registeredAt: string;
  status: CustomerStatus;
  productCount: number;
  firstActivationAt?: string;
  nextRenewalDate: string;
  daysRemaining: number;
  lastAccessAt: string;
  avatarUrl?: string;
  internalNotes: string;
}

export interface Product {
  id: string;
  uuid: string;
  activationCode: string;
  type?: ProductType;
  customerId?: string;
  status: ProductStatus;
  createdAt: string;
  internalCode: string;
  activatedAt?: string;
  expiresAt?: string;
  daysRemaining?: number;
  lotId: string;
  programmedAt?: string;
  programmedBy?: string;
  nfcUrl: string;
}

export interface Lot {
  id: string;
  code: string;
  description?: string;
  quantity: number;
  usedQuantity: number;
  availableQuantity: number;
  supplier?: string;
  createdAt: string;
  notes?: string;
}

export interface NFCProgrammingRecord {
  id: string;
  productId: string;
  uuid: string;
  programmedAt: string;
  programmedBy: string;
  status: 'Sucesso' | 'Falha';
  lotId?: string;
  chipSerialNumber?: string;
  verified?: boolean;
}

export interface Notification {
  id: string;
  customerId?: string;
  productId?: string;
  title: string;
  message: string;
  channel: 'Email' | 'WhatsApp' | 'Painel' | 'Push';
  sentAt: string;
  openedAt?: string;
  resolvedAt?: string;
  status: 'Enviado' | 'Aberto' | 'Ignorado' | 'Resolvido' | 'Falhou';
  trigger: string;
}

export interface Renewal {
  id: string;
  productId: string;
  customerId: string;
  renewedAt: string;
  previousExpiresAt?: string;
  newExpiresAt: string;
  periodYears: number;
  amount: number;
}

export interface LogEntry {
  id: string;
  action:
    | 'Login'
    | 'Logout'
    | 'Cadastro'
    | 'Edição'
    | 'Exclusão'
    | 'Renovação'
    | 'Ativação'
    | 'Programação NFC'
    | 'Troca de cliente'
    | 'Alteração de validade'
    | 'Mudança de status'
    | 'Criação de lote';
  entityType: 'Customer' | 'Product' | 'Lot' | 'Notification' | 'Renewal' | 'NFCProgramming' | 'System';
  entityId: string;
  performedBy: string;
  performedAt: string;
  details: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPPORT';
  avatarUrl?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type AdminModule =
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'lots'
  | 'nfc'
  | 'validity'
  | 'notifications'
  | 'analytics'
  | 'guide'
  | 'settings';
