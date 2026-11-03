import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function getPushState(): Promise<PushState> {
  // No iPhone/iPad o push só existe com o painel instalado na tela inicial (iOS 16.4+)
  if (isIOS() && !isStandalone()) return 'ios-install';
  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  const sub = await currentSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Salva (ou reassume, se outro usuário usou o mesmo aparelho) a subscription no banco. */
async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const { error } = await supabase.rpc('register_push', {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth,
    p_ua: navigator.userAgent.slice(0, 200),
  });
  if (error) throw error;
}

/** Chame a partir de um clique (botão "Ativar notificações"). */
export async function enablePush(): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';

  await navigator.serviceWorker.register('/sw.js');
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    }));
  await saveSubscription(sub);
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const sub = await currentSubscription();
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  }
  return 'off';
}

/** Chame ao logar: se já deu permissão, vincula este aparelho ao usuário atual. */
export async function syncPushOnLogin() {
  try {
    if ((await getPushState()) !== 'on') return;
    const sub = await currentSubscription();
    if (sub) await saveSubscription(sub);
  } catch { /* silencioso */ }
}
