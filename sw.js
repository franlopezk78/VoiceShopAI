const CACHE_NAME = 'voiceshop-v1';
const ASSETS = [ './', './index.html', './styles.css', './app.js', 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap', 'https://unpkg.com/lucide@latest' ];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
