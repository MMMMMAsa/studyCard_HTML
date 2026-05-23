// sw.js
const CACHE_NAME = 'leitner-v8';

// 主页面 URL：当前 sw.js 所在目录的 index.html
const MAIN_PAGE = new URL('./index.html', self.location.href).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 缓存主页面
      return cache.add(MAIN_PAGE).catch(err => {
        console.warn('预缓存失败，将尝试在首次访问时缓存', err);
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
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // 对于 navigation 请求（页面加载），缓存优先，确保离线可用
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(MAIN_PAGE).then(cached => {
        if (cached) return cached;
        // 无缓存时尝试网络，成功则缓存
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(MAIN_PAGE, clone));
          }
          return response;
        }).catch(() => {
          // 离线且无缓存，返回一个简单的离线提示（可选）
          return new Response('离线，请稍后重试', { status: 503 });
        });
      })
    );
    return;
  }

  // 其他资源：网络优先，失败时回退缓存
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 接收 SKIP_WAITING 消息，立即激活
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
