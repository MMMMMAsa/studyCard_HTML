const CACHE_NAME = 'leitner-v5';

// 主页面 URL：这里假设你的主页面是 index.html
const MAIN_PAGE = self.location.origin + '/leitner/index.html';
// 如果你的仓库名就是 leitner，且主页面在根目录，请按实际情况调整

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add(MAIN_PAGE).catch(err => {
        console.warn('预缓存失败:', err);
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
        // 离线且无缓存时，返回主页面
        return caches.match(MAIN_PAGE);
      });
    })
  );
});