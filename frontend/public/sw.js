// sw.js — سرویس‌ورکر ساده‌ی لوکاوو
// هدف اصلی: قابل‌نصب‌شدن اپ (Add to Home Screen) + یک حداقل پشتیبانی آفلاین.
// استراتژی: شبکه اول (network-first) با بازگشت به کش وقتی اینترنت نیست —
// یعنی همیشه آخرین نسخه‌ی سایت رو می‌گیره، و فقط وقتی واقعاً آفلاینه از کش استفاده می‌کنه.

const CACHE_NAME = 'lokaoo-cache-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // فقط درخواست‌های GET همین سایت رو مدیریت کن؛ درخواست‌های API/بک‌اند
  // و دامنه‌های دیگر (مثل فونت یا نقشه) دست‌نخورده به شبکه می‌رن.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});
