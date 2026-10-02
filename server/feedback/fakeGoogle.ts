import { generateKeyPairSync } from "node:crypto";

/**
 * Un Google Drive/Sheets y un Claude de mentira, en memoria, para probar el
 * servicio sin red ni credenciales: entiende solo las llamadas que hace el
 * servidor de feedback.
 */
export interface FakeSpreadsheet {
  id: string;
  name: string;
  campaignId: string;
  comments: string[][];
  summaries: string[][];
  shared: string[];
  tabsBuilt: boolean;
}

export function createFakeServiceAccountJson(): string {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  return JSON.stringify({ client_email: "feedback@proyecto.iam.gserviceaccount.com", private_key: privateKey });
}

export interface FakeCloud {
  fetchImpl: typeof fetch;
  sheets: FakeSpreadsheet[];
  calls: { url: string; method: string; body: unknown; headers: Record<string, string> }[];
  claude: { reply: string | Error | null; requests: Record<string, unknown>[] };
  /** Falla la creación de permisos de este correo. */
  failShareFor: Set<string>;
  /** Simula una carrera: otra instancia crea una hoja justo antes que esta. */
  raceOnCreate: boolean;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function createFakeCloud(): FakeCloud {
  const cloud: FakeCloud = {
    sheets: [],
    calls: [],
    claude: { reply: null, requests: [] },
    failShareFor: new Set(),
    raceOnCreate: false,
    fetchImpl: undefined as unknown as typeof fetch,
  };
  let nextId = 1;

  const byId = (id: string) => cloud.sheets.find((sheet) => sheet.id === id);

  cloud.fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>));
    const rawBody = init?.body;
    const body = typeof rawBody === "string" ? (JSON.parse(rawBody) as unknown) : rawBody;
    cloud.calls.push({ url, method, body, headers });

    if (url === "https://oauth2.googleapis.com/token") return json({ access_token: "token-falso", expires_in: 3600 });

    if (url === "https://api.anthropic.com/v1/messages") {
      cloud.claude.requests.push(body as Record<string, unknown>);
      const reply = cloud.claude.reply;
      if (reply instanceof Error) return json({ error: { message: reply.message } }, 529);
      return json({ model: "claude-sonnet-5-5", content: [{ type: "text", text: reply ?? "{}" }] });
    }

    if (url.startsWith("https://www.googleapis.com/drive/v3/files?")) {
      const query = new URL(url).searchParams.get("q") ?? "";
      const campaignId = /themaCampaignId' and value='([^']+)'/.exec(query)?.[1];
      const files = cloud.sheets.filter((sheet) => sheet.campaignId === campaignId).map((sheet) => ({ id: sheet.id, name: sheet.name, createdTime: sheet.id }));
      return json({ files });
    }

    if (url === "https://www.googleapis.com/drive/v3/files" && method === "POST") {
      const meta = body as { name: string; appProperties: { themaCampaignId: string } };
      if (cloud.raceOnCreate) {
        cloud.raceOnCreate = false;
        cloud.sheets.push({ id: `hoja-${String(nextId++).padStart(3, "0")}`, name: meta.name, campaignId: meta.appProperties.themaCampaignId, comments: [], summaries: [], shared: [], tabsBuilt: true });
      }
      const sheet: FakeSpreadsheet = { id: `hoja-${String(nextId++).padStart(3, "0")}`, name: meta.name, campaignId: meta.appProperties.themaCampaignId, comments: [], summaries: [], shared: [], tabsBuilt: false };
      cloud.sheets.push(sheet);
      return json({ id: sheet.id });
    }

    const file = /drive\/v3\/files\/([^/?]+)(\/permissions)?/.exec(url);
    if (file && method === "DELETE") {
      cloud.sheets.splice(cloud.sheets.findIndex((sheet) => sheet.id === file[1]), 1);
      return new Response(null, { status: 204 });
    }
    if (file?.[2] && method === "POST") {
      const email = (body as { emailAddress: string }).emailAddress;
      if (cloud.failShareFor.has(email)) return json({ error: { message: "Dominio no permitido" } }, 403);
      byId(file[1])?.shared.push(email);
      return json({ id: "permiso" });
    }

    const sheetsCall = /sheets\.googleapis\.com\/v4\/spreadsheets\/([^/:?]+)(.*)/.exec(url);
    if (sheetsCall) {
      const sheet = byId(sheetsCall[1]);
      if (!sheet) return json({ error: { message: "No existe la hoja" } }, 404);
      const rest = decodeURIComponent(sheetsCall[2]);
      if (rest.startsWith(":batchUpdate")) {
        sheet.tabsBuilt = true;
        return json({});
      }
      if (rest.startsWith("/values:batchUpdate")) return json({});
      const tab = /\/values\/(Comentarios|Resumen)!/.exec(rest)?.[1];
      const rows = tab === "Comentarios" ? sheet.comments : sheet.summaries;
      if (tab && rest.includes(":append")) {
        rows.push(...(body as { values: string[][] }).values);
        return json({});
      }
      if (tab) return json({ values: [["cabecera"], ...rows] });
    }

    return json({ error: { message: `Llamada no prevista: ${method} ${url}` } }, 500);
  }) as typeof fetch;

  return cloud;
}
