const CACHE_NAME = 'vision-edu-v3';
const ASSETS_TO_CACHE = [
  '/login',
  '/dashboard',
  '/analytics',
  '/mocks',
  '/robotics-dashboard',
  '/about',
  '/style.css',
  '/theme.js',
  '/assets/logo.png',
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
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
