import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedbackSettings, FeedbackStatus, SiteFeedback } from '@/lib/siteFeedbacks';

export type FeedbackPatch = Partial<Pick<SiteFeedback,
  'name' | 'role' | 'contact_phone' | 'contact_email' | 'rating' | 'comment' | 'photo_url' |
  'consent_publish' | 'status' | 'featured' | 'admin_notes' | 'seen' | 'published_at'>>;

/** Gestão dos feedbacks do site (admin), com tempo real. */
export function useSiteFeedbacks(onNew?: (f: SiteFeedback) => void) {
  const [items, setItems] = useState<SiteFeedback[]>([]);
  const [settings, setSettings] = useState<FeedbackSettings>({ show_section: true, show_summary: true, eyebrow: null, title: null, subtitle: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const known = useRef<Set<string>>(new Set());
  const cb = useRef(onNew); cb.current = onNew;

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('site_feedbacks').select('*').order('created_at', { ascending: false }).limit(1000);
    if (err) { setError(err.message); setLoading(false); return; }
    setError(null);
    const list = (data ?? []) as SiteFeedback[];
    list.forEach(f => known.current.add(f.id));
    setItems(list);
    const { data: cfg } = await supabase.from('site_feedback_settings').select('show_section, show_summary, eyebrow, title, subtitle').eq('id', 1).maybeSingle();
    if (cfg) setSettings(cfg as FeedbackSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-site-feedbacks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_feedbacks' }, (p) => {
        if (p.eventType === 'INSERT') {
          const f = p.new as SiteFeedback;
          if (known.current.has(f.id)) return;
          known.current.add(f.id);
          setItems(prev => [f, ...prev]);
          cb.current?.(f);
        } else if (p.eventType === 'UPDATE') {
          const f = p.new as SiteFeedback;
          setItems(prev => prev.map(x => (x.id === f.id ? f : x)));
        } else if (p.eventType === 'DELETE') {
          const id = (p.old as { id: string }).id;
          setItems(prev => prev.filter(x => x.id !== id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const update = useCallback(async (id: string, fields: FeedbackPatch) => {
    setItems(prev => prev.map(f => (f.id === id ? { ...f, ...fields } as SiteFeedback : f)));
    const { error: err } = await supabase.from('site_feedbacks').update(fields).eq('id', id);
    if (err) { setError(err.message); load(); }
  }, [load]);

  const setStatus = (id: string, status: FeedbackStatus) =>
    update(id, { status, seen: true, ...(status === 'publicado' ? { published_at: new Date().toISOString() } : {}) });

  const remove = useCallback(async (id: string) => {
    setItems(prev => prev.filter(f => f.id !== id));
    const { error: err } = await supabase.from('site_feedbacks').delete().eq('id', id);
    if (err) { setError(err.message); load(); }
  }, [load]);

  /** Depoimento criado por você (ex.: um elogio recebido por WhatsApp). */
  const add = useCallback(async (f: {
    name: string; role: string; rating: number; comment: string; photo_url: string;
    contact_phone: string; contact_email: string; consent_publish: boolean; publish: boolean;
  }) => {
    const now = new Date().toISOString();
    const { error: err } = await supabase.from('site_feedbacks').insert({
      name: f.name.trim() || null, role: f.role.trim() || null, rating: f.rating,
      comment: f.comment.trim() || null, photo_url: f.photo_url.trim() || null,
      contact_phone: f.contact_phone.trim() || null, contact_email: f.contact_email.trim() || null,
      consent_publish: f.consent_publish, source: 'manual', seen: true,
      status: f.publish ? 'publicado' : 'pendente', published_at: f.publish ? now : null,
    });
    if (err) throw new Error(err.message);
    await load();
  }, [load]);

  const saveSettings = useCallback(async (next: FeedbackSettings) => {
    setSettings(next);
    const { error: err } = await supabase.from('site_feedback_settings').upsert({ id: 1, ...next, updated_at: new Date().toISOString() });
    if (err) throw new Error(err.message);
  }, []);

  const pending = items.filter(f => f.status === 'pendente' && !f.seen).length;
  return { items, settings, loading, error, pending, update, setStatus, remove, add, saveSettings, reload: load };
}
