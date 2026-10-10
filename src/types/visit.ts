export interface Visit {
  id: string;
  productId: string;
  type: 'nfc' | 'qr' | 'link';
  action?:
    | 'view'
    | 'whatsapp'
    | 'instagram'
    | 'linkedin'
    | 'email'
    | 'phone'
    | 'site'
    | 'share';
  city: string;
  device: string;
  createdAt: string;
}