export interface AppNotification {
  id: string;
  type: 'view' | 'system' | 'renewal' | 'feedback';
  title: string;
  message: string;
  productId?: string;
  read: boolean;
  createdAt: string;
}