/*global UVServiceWorker,__uv$config*/
/*
 * Stock service worker script.
 * Users can provide their own sw.js if they need to extend the functionality of the service worker.
 * Ideally, this will be registered under the scope in uv.config.js so it will not need to be modified.
 * However, if a user changes the location of uv.bundle.js/uv.config.js or sw.js is not relative to them, they will need to modify this script locally.
 */
importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');

const sw = new UVServiceWorker();

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith('/p/') || u.pathname.startsWith('/uv/') || u.pathname.startsWith('/bare/')) {
    e.respondWith(sw.fetch(e));
    return;
  }
  e.respondWith(sw.fetch(new Request(`/p/${btoa(u.href).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}`, e.request)));
});
