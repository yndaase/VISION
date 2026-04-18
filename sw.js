const CACHE_NAME = 'vision-edu-v5';
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
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
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
