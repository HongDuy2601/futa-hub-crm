/* ============================================================
 * FUTA HUB CRM - SERVICE WORKER
 * Cache app shell để chạy offline hoàn toàn (cài như app)
 * ============================================================ */

const CACHE_NAME = 'futa-crm-v2.1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/data.js',
  './js/permissions.js',
  './js/admin.js',
  './js/executive.js',
  './js/login.js',
  './js/storage.js',
  './js/charts.js',
  './js/inventory.js',
  './js/notifications.js',
  './js/communication.js',
  './js/tasks.js',
  './js/targets.js',
  './js/ai.js',
  './js/sync.js',
  './js/leads.js',
  './js/deals.js',
  './js/dashboard.js',
  './js/reports.js',
  './js/settings.js',
  './js/app.js',
  './manifest.webmanifest',
  '../assets/js/data.js',
  '../assets/img/logo-futa-land.png',
  '../assets/img/logo-futa-square.png',
  '../assets/img/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Không cache request tới Supabase / API ngoài / LLM — luôn đi mạng
  if (url.origin !== location.origin ||
      url.pathname.includes('/rest/v1/') ||
      url.hostname.includes('googleapis') ||
      url.port === '11434') {
    return; // để browser xử lý bình thường
  }

  // App shell: cache-first, fallback network, rồi cập nhật cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
