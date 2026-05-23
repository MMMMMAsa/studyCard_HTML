// sw.js
const CACHE_NAME = 'leitner-v6';

// 动态获取正确的根页面 URL
// 如果 sw.js 在 https://user.github.io/leitner/sw.js，
// 则 self.location 就是该 URL，我们替换 'sw.js' 为 'index.html'
const MAIN_PAGE = self.location.href.replace(/sw\.js$/, 'index.html');

self.addEventListener('install', event => {
  console.log('SW 尝试安装，缓存目标:', MAIN_PAGE);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add(MAIN_PAGE).catch(err => {
        console.error('SW 预缓存失败:', err);
        // 如果 index.html 失败，尝试缓存当前目录的 './'
        return cache.add('./').catch(err2 => {
          console.error('SW 备选缓存也失败:', err2);
        });
      });
    }).then(() => {
      console.log('SW 安装完成，即将激活');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('SW 激活事件');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log('SW 已激活并控制客户端');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        console.log('SW 缓存命中:', event.request.url);
        return cached;
      }
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        console.log('SW 网络失败，回退到主页缓存');
        return caches.match(MAIN_PAGE);
      });
    })
  );
});
