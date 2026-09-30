import { describe, expect, test } from "vitest";
import { MAX_BODY_BYTES, isAuthorized, isSameOrigin, readJsonBody } from "./http.js";

const request = (headers: Record<string, string> = {}, body?: string) =>
  new Request("https://app.barberlytics.com/api/feedback", { method: "POST", headers, body });

describe("isAuthorized", () => {
  const config = { adminKey: "clave-admin", cronSecret: "secreto-cron" };

  test("acepta la clave de administración y el secreto del cron", () => {
    expect(isAuthorized(request({ authorization: "Bearer clave-admin" }), config)).toBe(true);
    expect(isAuthorized(request({ authorization: "Bearer secreto-cron" }), config)).toBe(true);
  });

  test("rechaza lo demás, incluida una clave vacía cuando no hay ninguna configurada", () => {
    expect(isAuthorized(request(), config)).toBe(false);
    expect(isAuthorized(request({ authorization: "Bearer otra" }), config)).toBe(false);
    expect(isAuthorized(request({ authorization: "clave-admin" }), config)).toBe(false);
    expect(isAuthorized(request({ authorization: "Bearer " }), { adminKey: undefined, cronSecret: undefined })).toBe(false);
  });
});

describe("isSameOrigin", () => {
  test("deja pasar el mismo sitio y las llamadas sin origen, y bloquea otro sitio", () => {
    expect(isSameOrigin(request({ origin: "https://app.barberlytics.com" }))).toBe(true);
    expect(isSameOrigin(request())).toBe(true);
    expect(isSameOrigin(request({ origin: "https://malo.example" }))).toBe(false);
    expect(isSameOrigin(request({ origin: "no-es-una-url" }))).toBe(false);
  });
});

describe("readJsonBody", () => {
  test("lee JSON y devuelve undefined si es enorme o no es JSON", async () => {
    expect(await readJsonBody(request({}, '{"a":1}'))).toEqual({ a: 1 });
    expect(await readJsonBody(request({}, "no json"))).toBeUndefined();
    expect(await readJsonBody(request({}, JSON.stringify({ a: "x".repeat(MAX_BODY_BYTES) })))).toBeUndefined();
  });
});
