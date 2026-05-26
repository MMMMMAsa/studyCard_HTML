// sw.js
const CACHE_NAME = 'leitner-v-CACHE_VERSION_PLACEHOLDER';

// 主页面 URL
const MAIN_PAGE = new URL('./index.html', self.location.href).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add(MAIN_PAGE).catch(() => {});
    })
    // 删除了强制的 skipWaiting()
    // 现在新版本下载完会乖乖在后台 waiting（排队），等待用户点击更新按钮
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
                        (new URL(event.request.url).pathname.endsWith('/studyCard_HTML/') || 
                         new URL(event.request.url).pathname.endsWith('/studyCard_HTML/index.html'));

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

// 接收弹窗按钮发来的确认指令，这时候才真正接管
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
