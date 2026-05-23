// sw.js
const CACHE_NAME = 'leitner-v9';

// 主页面 URL
const MAIN_PAGE = new URL('./index.html', self.location.href).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add(MAIN_PAGE).catch(() => {});
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

  // 只对主页面（index.html）的导航请求做缓存优先
  const isMainPageNav = event.request.mode === 'navigate' &&
                        new URL(event.request.url).pathname.endsWith('/studyCard_HTML/') || 
                        new URL(event.request.url).pathname.endsWith('/studyCard_HTML/index.html');

  if (isMainPageNav) {
    event.respondWith(
      caches.match(MAIN_PAGE).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(MAIN_PAGE, clone));
          }
          return response;
        });
      }).catch(() => {
        return caches.match(MAIN_PAGE);
      })
    );
    return;
  }

  // 其他请求：网络优先，失败回退缓存
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
