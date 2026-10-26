import { useEffect, useState } from 'react';
import { fetchFeedbackSettings, fetchPublicFeedbacks, type FeedbackSettings, type PublicFeedback } from '@/lib/siteFeedbacks';

/** Feedbacks publicados + configurações da seção. Busca depois do carregamento inicial (não pesa no LCP). */
export function usePublicFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<PublicFeedback[]>([]);
  const [settings, setSettings] = useState<FeedbackSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(async () => {
      const [list, cfg] = await Promise.all([fetchPublicFeedbacks(), fetchFeedbackSettings()]);
      if (!alive) return;
      setFeedbacks(list); setSettings(cfg); setLoaded(true);
    }, 1500);
    return () => { alive = false; window.clearTimeout(t); };
  }, []);

  return { feedbacks, settings, loaded };
}
