import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { cleanup } from "@testing-library/react";
import { server } from "@/mocks/server";
import { db } from "@/mocks/db";
import { setClipperLogSink } from "../../server/clipper/turnLog";

// El registro de Clipper sale por consola en el servidor; en las pruebas no hace falta verlo.
setClipperLogSink(() => undefined);

// El backend simulado responde en todas las pruebas; cualquier petición no
// prevista es un error, nunca una llamada real.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// La voz natural de Clipper (api/tts) no existe en pruebas: responde «sin servicio» y se usa la
// del navegador. No va en los mocks de desarrollo, que dejarían sin voz real al servidor local.
// Lo mismo con Clipper (api/clipper): sin clave, responde el centro de ayuda.
beforeEach(() =>
  server.use(
    http.post("*/api/tts", () => HttpResponse.json({ code: "tts_not_configured" }, { status: 501 })),
    http.post("*/api/clipper", () => HttpResponse.json({ code: "not_configured" }, { status: 501 })),
    http.post("*/api/clipper/feedback", () => new HttpResponse(null, { status: 204 })),
    // La sesión firmada y la cola de WhatsApp tampoco: sin funciones, la app sigue con su respaldo.
    http.post("*/api/session", () => HttpResponse.json({ code: "not_found" }, { status: 404 })),
    http.post("*/api/session/guest", () => HttpResponse.json({ code: "not_found" }, { status: 404 })),
    http.all("*/api/whatsapp/queue", () => HttpResponse.json({ code: "queue_not_configured" }, { status: 501 }))
  )
);
afterEach(() => {
  server.resetHandlers();
  db.reset();
  cleanup();
  window.sessionStorage.clear();
  window.localStorage.clear();
});
afterAll(() => server.close());

// jsdom no implementa estas APIs que usan Radix, framer-motion y el ThemeProvider.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(window, { ResizeObserver: ResizeObserverStub });
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
// jsdom no trae canvas: sin contexto 2D las piezas de atmósfera (HairCanvas,
// HairBurst) no dibujan, en vez de llenar la salida con «Not implemented».
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
