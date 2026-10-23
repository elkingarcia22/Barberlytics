import { describe, expect, test } from "vitest";
import { routeGroup } from "./routeGroup.js";

describe("routeGroup", () => {
  const group = routeGroup({
    queue: { GET: () => new Response("cola"), POST: () => new Response("encolado") },
    inbox: { GET: () => new Response("bandeja") },
  });

  test("reparte por el último tramo de la ruta y por método", async () => {
    expect(await (await group.GET(new Request("https://demo.app/api/whatsapp/queue?ids=a"))).text()).toBe("cola");
    expect(await (await group.POST(new Request("https://demo.app/api/whatsapp/queue", { method: "POST" }))).text()).toBe("encolado");
    expect(await (await group.GET(new Request("https://demo.app/api/whatsapp/inbox"))).text()).toBe("bandeja");
  });

  test("404 si la ruta no existe y 405 si el método no lo atiende", async () => {
    expect((await group.GET(new Request("https://demo.app/api/whatsapp/nada"))).status).toBe(404);
    expect((await group.GET(new Request("https://demo.app/api/whatsapp/toString"))).status).toBe(404);
    expect((await group.DELETE(new Request("https://demo.app/api/whatsapp/inbox", { method: "DELETE" }))).status).toBe(405);
  });
});
