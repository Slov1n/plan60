// Форма 60 — офлайн-кеш. Змінюй VERSION після кожного оновлення файлів.
const VERSION = "forma60-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Сторінка: спершу мережа (щоб оновлення приходили), офлайн — з кешу
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Решта (іконки, шрифти): кеш, потім мережа
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") {
      if (url.origin === location.origin || url.host.includes("fonts.g")) {
        const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy));
      }
    }
    return r;
  }).catch(() => hit)));
});
