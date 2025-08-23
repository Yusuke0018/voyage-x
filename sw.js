// Service Worker for Voyage PWA
const CACHE_NAME = 'voyage-v1.1.8'; // バージョンを更新してキャッシュクリア
const urlsToCache = [
  '/voyage-x/',
  '/voyage-x/index.html',
  '/voyage-x/assets/voyage.css',
  '/voyage-x/assets/voyage.js',
  '/voyage-x/manifest.json'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// リクエスト時にキャッシュから返す
self.addEventListener('fetch', event => {
  const req = event.request;
  // HTML/CSS/JSはネットワーク優先で常に最新を取得
  if (req.destination === 'document' || req.destination === 'script' || req.destination === 'style') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }
  // それ以外はキャッシュ優先
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
