import { describe, expect, test, vi } from "vitest";
import { buildUrl, createApiClient } from "./client";
import { ApiError } from "./errors";
import { z } from "zod";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("buildUrl", () => {
  test("joins base and path and drops empty query values", () => {
    expect(buildUrl("/api", "/users", { page: 2, search: "", status: undefined, active: false })).toBe("/api/users?page=2&active=false");
  });

  test("keeps absolute urls untouched", () => {
    expect(buildUrl("/api", "https://x.test/y")).toBe("https://x.test/y");
  });
});

describe("createApiClient", () => {
  test("sends the bearer token and parses JSON", async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true }));
    const client = createApiClient({ baseUrl: "/api", auth: { getToken: () => "abc" }, fetchImpl });
    const result = await client.get<{ ok: boolean }>("/ping");
    expect(result).toEqual({ ok: true });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer abc");
  });

  test("maps a 422 with fields into an ApiError with fieldErrors", async () => {
    const fetchImpl = vi.fn(async () => json({ code: "validation", message: "Revisa", fields: { email: ["Ya existe"] } }, 422));
    const client = createApiClient({ baseUrl: "/api", fetchImpl });
    const error = await client.post("/users", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("validation");
    expect((error as ApiError).fieldErrors).toEqual({ email: ["Ya existe"] });
  });

  test("a 401 notifies onUnauthorized", async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn(async () => json({ message: "expired" }, 401));
    const client = createApiClient({ baseUrl: "/api", auth: { getToken: () => "old", onUnauthorized }, fetchImpl });
    await expect(client.get("/me")).rejects.toMatchObject({ code: "unauthorized" });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  test("a network failure becomes code 'network'", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const client = createApiClient({ baseUrl: "/api", fetchImpl });
    await expect(client.get("/x")).rejects.toMatchObject({ code: "network", status: 0 });
  });

  test("a response that fails the schema becomes 'invalid_response'", async () => {
    const fetchImpl = vi.fn(async () => json({ id: 1 }));
    const client = createApiClient({ baseUrl: "/api", fetchImpl });
    await expect(client.get("/x", { schema: z.object({ id: z.string() }) })).rejects.toMatchObject({ code: "invalid_response" });
  });

  test("204 resolves to undefined", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl: "/api", fetchImpl });
    await expect(client.delete("/x/1")).resolves.toBeUndefined();
  });
});
