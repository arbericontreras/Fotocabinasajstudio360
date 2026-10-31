/* Service worker del panel de asesores: permite mostrar avisos del teléfono (notificaciones) y abrir el panel al tocarlos. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window", includeUncontrolled:true}).then(lista => {
    for(const c of lista){ if("focus" in c) return c.focus(); }
    return self.clients.openWindow("asesor.html");
  }));
});
 