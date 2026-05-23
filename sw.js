// sw.js
const CACHE_NAME = 'leitner-v6';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 直接缓存'/'（根路径），GitHub Pages 下会自动返回 index.html
      return cache.add('/').catch(err => {
        // 如果失败，尝试缓存 './'
        return cache.add('./');
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 无网络且无缓存时，返回缓存的根页面
        return caches.match('/') || caches.match('./');
      });
    })
  );
});
