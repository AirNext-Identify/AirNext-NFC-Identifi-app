// Service Worker do AirNext — recebe os pushes e mostra a notificação no aparelho.
// Fica na RAIZ do site (https://airnext.com.br/sw.js).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }

  const title = data.title || 'AirNext';
  const options = {
    body: data.body || '',
    icon: '/logo-airnext.png',
    badge: '/logo-airnext.png',
    // Mesma "tag" que o painel usa (id do alerta): se a aba estiver aberta, uma notificação substitui a outra
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        await c.focus();
        if ('navigate' in c) await c.navigate(target).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
