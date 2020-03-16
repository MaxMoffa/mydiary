/*

  Service Worker for My Diary
  By @max.moffa
  email: massimomoffa02@gmail.com

*/

//Configuration

const CACHE_VERSION = "1.0.0";
const CACHE_NAME = "MyDiary:" + CACHE_VERSION;
const CACHE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./global.css",
  "./media/image/loading.gif",
  "./media/image/error.png",
  "./media/image/empty.gif",
  "./build/bundle.css",
  "./build/bundle.css.map",
  "./build/bundle.js",
  "./build/bundle.js.map"
]

//Functions
console.log(CACHE_NAME);

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(CACHE_FILES);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request).then(function(response){
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
