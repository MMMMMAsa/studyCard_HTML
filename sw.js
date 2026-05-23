// sw.js
const CACHE_NAME = 'leitner-v7';

// 动态获取站点根路径：去掉 sw.js 文件名即为根目录
const MAIN_PAGE = self.location.href.replace(/sw\.js$/, '');

self.addEventListener('install', event => {
  console.log('SW 安装中，缓存根路径:', MAIN_PAGE);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add(MAIN_PAGE).catch(err => {
        console.error('缓存根路径失败，尝试 ./index.html');
        return cache.add('./index.html');
      });
    }).then(() => {
      console.log('SW 安装完成');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('SW 激活');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log('SW 已控制客户端');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 离线且无缓存时，返回主页缓存
        return caches.match(MAIN_PAGE);
      });
    })
  );
});
