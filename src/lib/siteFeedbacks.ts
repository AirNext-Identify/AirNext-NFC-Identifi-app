import { supabase } from './supabase';

export type FeedbackStatus = 'pendente' | 'publicado' | 'oculto';

export interface SiteFeedback {
  id: string;
  name: string | null;
  role: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  source: string;
  consent_publish: boolean;
  status: FeedbackStatus;
  featured: boolean;
  admin_notes: string | null;
  seen: boolean;
  created_at: string;
  published_at: string | null;
  updated_at: string;
}

/** O que a landing page enxerga (nunca contato nem anotações internas). */
export interface PublicFeedback {
  id: string;
  name: string | null;
  role: string | null;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  featured: boolean;
  published_at: string | null;
}

export interface FeedbackSettings {
  show_section: boolean;
  show_summary: boolean;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
}

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  pendente: 'Pendente',
  publicado: 'Publicado',
  oculto: 'Oculto',
};

/** Envia um feedback do visitante (sempre entra como "pendente"). Nunca quebra o fluxo do cliente. */
export async function saveSiteFeedback(input: {
  name?: string; phone?: string; rating: number; comment?: string; source: string; consent: boolean;
}): Promise<void> {
  if (!input.rating) return;
  try {
    const { error } = await supabase.from('site_feedbacks').insert({
      name: input.name?.trim().slice(0, 120) || null,
      contact_phone: input.phone?.trim().slice(0, 40) || null,
      rating: input.rating,
      comment: input.comment?.trim().slice(0, 1200) || null,
      source: input.source.slice(0, 80),
      consent_publish: input.consent,
    });
    if (error) console.warn('Feedback não registrado no painel:', error.message);
  } catch (e) {
    console.warn('Feedback não registrado no painel:', e);
  }
}

export async function fetchPublicFeedbacks(): Promise<PublicFeedback[]> {
  // Função do banco (sql/16): só publicados e só campos seguros, já ordenados (destaques primeiro).
  const { data, error } = await supabase.rpc('get_public_feedbacks', { p_limit: 30 });
  if (error) return [];
  return (data ?? []) as PublicFeedback[];
}

export async function fetchFeedbackSettings(): Promise<FeedbackSettings | null> {
  const { data, error } = await supabase
    .from('site_feedback_settings')
    .select('show_section, show_summary, eyebrow, title, subtitle')
    .eq('id', 1)
    .maybeSingle();
  if (error) return null;
  return (data as FeedbackSettings) ?? null;
}
