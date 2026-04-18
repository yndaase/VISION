const CACHE_NAME = 'vision-edu-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login',
  '/dashboard',
  '/analytics',
  '/mocks',
  '/robotics-dashboard',
  '/about',
  '/features',
  '/pricing',
  '/parent-portal',
  '/robotics',
  '/style.css',
  '/theme.css',
  '/dashboard.css',
  '/homepage.css',
  '/login.css?v=6',
  '/theme.js',
  '/app.js',
   '/auth.js',
   '/firebase.js',
   '/questions.js',
   '/register-sw.js',
   '/whatsapp-service.js',
   '/assets/logo.png',
  '/assets/crest.png',
  '/assets/augusco_crest.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
