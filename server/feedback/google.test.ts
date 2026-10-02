import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, test } from "vitest";
import { createFakeServiceAccountJson } from "./fakeGoogle.js";
import { GOOGLE_SCOPES, GoogleApiError, createGoogleClient, parseServiceAccount, signServiceAccountJwt } from "./google.js";

describe("parseServiceAccount", () => {
  test("lee el JSON directo y en base64", () => {
    const json = createFakeServiceAccountJson();
    const direct = parseServiceAccount(json);
    expect(direct.client_email).toBe("feedback@proyecto.iam.gserviceaccount.com");
    expect(parseServiceAccount(Buffer.from(json).toString("base64"))).toEqual(direct);
  });

  test("repone los saltos de línea que llegan escapados en la variable de entorno", () => {
    const escaped = JSON.stringify({ client_email: "a@b.iam", private_key: "-----BEGIN-----\\nabc\\n-----END-----" });
    expect(parseServiceAccount(escaped).private_key).toBe("-----BEGIN-----\nabc\n-----END-----");
  });

  test("da un error claro si no sirve", () => {
    expect(() => parseServiceAccount("{no json")).toThrow(/no es un JSON válido/);
    expect(() => parseServiceAccount(JSON.stringify({ client_email: "a@b" }))).toThrow(/client_email y private_key/);
  });
});

describe("signServiceAccountJwt", () => {
  test("es un RS256 verificable con la clave pública y lleva los datos que Google pide", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const jwt = signServiceAccountJwt({ client_email: "a@b.iam", private_key: privateKey }, GOOGLE_SCOPES, 1_700_000_000_000);
    const [header, claims, signature] = jwt.split(".");

    expect(createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, signature, "base64url")).toBe(true);
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(claims, "base64url").toString())).toEqual({
      iss: "a@b.iam",
      scope: GOOGLE_SCOPES.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });
});

describe("createGoogleClient", () => {
  const account = parseServiceAccount(createFakeServiceAccountJson());
  const tokenResponse = () => new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }));

  test("renueva el token cuando está a punto de caducar", async () => {
    let clock = 0;
    let tokens = 0;
    const client = createGoogleClient(account, {
      now: () => clock,
      fetchImpl: (async (url: string) => {
        if (url.includes("oauth2")) {
          tokens += 1;
          return tokenResponse();
        }
        return new Response("{}");
      }) as unknown as typeof fetch,
    });
    await client.json("https://x/1");
    clock = 3_000_000; // aún vigente
    await client.json("https://x/2");
    clock = 3_560_000; // a menos de un minuto de caducar
    await client.json("https://x/3");
    expect(tokens).toBe(2);
  });

  test("convierte un error de Google en GoogleApiError con su mensaje", async () => {
    const client = createGoogleClient(account, {
      fetchImpl: (async (url: string) =>
        url.includes("oauth2") ? tokenResponse() : new Response(JSON.stringify({ error: { message: "Cuota agotada" } }), { status: 429 })) as unknown as typeof fetch,
    });
    await expect(client.json("https://x")).rejects.toMatchObject({ name: "GoogleApiError", status: 429, message: "Cuota agotada" });
    await expect(client.json("https://x")).rejects.toBeInstanceOf(GoogleApiError);
  });

  test("si Google no da token, lo dice", async () => {
    const client = createGoogleClient(account, {
      fetchImpl: (async () => new Response(JSON.stringify({ error_description: "Invalid JWT Signature" }), { status: 400 })) as unknown as typeof fetch,
    });
    await expect(client.json("https://x")).rejects.toThrow("Invalid JWT Signature");
  });
});
