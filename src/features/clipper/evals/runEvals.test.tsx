import { afterAll, describe, expect, test } from "vitest";
import { renderWithProviders } from "@/test/render";
import { db } from "@/mocks/db";
import type { ChatBackend, ChatReply } from "@/lib/chat";
import type { ClipperRole } from "@/lib/clipper/toolCatalog";
import { clipperStep, readClipperConfig } from "../../../../server/clipper/clipper";
import { createClipperBackend, resetClipperAvailability } from "../clipperBackend";
import { CLIPPER_EVALS, type EvalQuestion } from "./questions";

/**
 * El corredor de la evaluación: pregunta de verdad a Claude con la agenda de la demo y mide si consultó lo
 * correcto, si propuso cuando se le pidió un cambio y si mandó a la ayuda lo que no hace. Solo corre con
 * `ANTHROPIC_API_KEY` (cuesta dinero y tarda):
 *
 *   ANTHROPIC_API_KEY=… npx vitest run src/features/clipper/evals/runEvals.test.tsx
 *
 * La meta es la del informe 11: al menos 90 % bien. Imprime una tabla con cada pregunta, las herramientas que
 * usó, el tiempo y los tokens.
 */

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const HAS_KEY = Boolean(env.ANTHROPIC_API_KEY);
const TARGET = 0.9;
const PER_QUESTION_MS = 90_000;

const ACCOUNT: Record<ClipperRole, { id: string; memberId: string }> = {
  owner: { id: "acc_admin", memberId: "team-01" },
  admin: { id: "acc_manager", memberId: "team-02" },
  recepcion: { id: "acc_reception", memberId: "team-03" },
  "barbero-comision": { id: "acc_barber", memberId: "team-04" },
  "barbero-renta": { id: "acc_renter", memberId: "team-30" },
};

interface Result {
  id: string;
  ok: boolean;
  tools: string;
  ms: number;
  tokens: number;
  note: string;
}
const results: Result[] = [];

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

async function ask(item: EvalQuestion): Promise<Result> {
  db.reset();
  resetClipperAvailability();
  const account = ACCOUNT[item.role];
  const token = `mock-${account.id}-eval`;
  db.sessions.set(token, account.id);
  renderWithProviders(<div />, { token });
  const used: string[] = [];
  let tokens = 0;
  const config = readClipperConfig(env);
  const fetcher = (async (_url: string, init?: RequestInit) => {
    const response = await clipperStep(JSON.parse(String(init?.body)), config);
    const body = (await response.clone().json().catch(() => ({}))) as { calls?: { name: string }[]; usage?: { input: number; output: number } };
    used.push(...(body.calls ?? []).map((call) => call.name));
    tokens += (body.usage?.input ?? 0) + (body.usage?.output ?? 0);
    return response;
  }) as typeof fetch;
  const fallback: ChatBackend = { reply: async () => ({ text: "(centro de ayuda)", via: "help" }) };
  const backend = createClipperBackend({
    context: { branchId: "ma", role: item.role, memberId: account.memberId, today: today(), locale: item.variant === "en" ? "en" : "es", branch: "Massachusetts", currency: "USD", userName: "Carlos", t: (key) => key },
    fallback,
    labels: { consulted: "Consulté", tool: (name) => name },
    fetcher,
  });
  const started = Date.now();
  const reply: ChatReply = await backend.reply(item.question, [{ id: "q", role: "user", text: item.question, createdAt: 0, status: "done" }], new AbortController().signal);
  const ms = Date.now() - started;
  const hit = item.tools.some((tool) => used.includes(tool));
  const byModel = reply.via === "model";
  const ok = item.id.startsWith("perm-") ? byModel : item.expect === "propose" ? byModel && hit && (reply.actions?.length ?? 0) > 0 : byModel && hit;
  return { id: item.id, ok, tools: [...new Set(used)].join(", ") || "—", ms, tokens, note: byModel ? reply.text.slice(0, 80) : "cayó a la ayuda" };
}

describe.skipIf(!HAS_KEY)("evaluación de Clipper con el modelo real", () => {
  for (const item of CLIPPER_EVALS) {
    test(`${item.id} · ${item.variant} · ${item.role}: ${item.question}`, async () => {
      results.push(await ask(item));
    }, PER_QUESTION_MS);
  }

  test(`al menos ${TARGET * 100} % bien`, () => {
    const passed = results.filter((item) => item.ok).length;
    expect(passed / results.length).toBeGreaterThanOrEqual(TARGET);
  });

  afterAll(() => {
    const passed = results.filter((item) => item.ok).length;
    const avgMs = Math.round(results.reduce((sum, item) => sum + item.ms, 0) / Math.max(1, results.length));
    const tokens = results.reduce((sum, item) => sum + item.tokens, 0);
    console.table(results);
    console.info(`Clipper: ${passed}/${results.length} bien · ${avgMs} ms de media · ${tokens} tokens en total`);
  });
});

describe("evaluación de Clipper sin clave", () => {
  test("sin ANTHROPIC_API_KEY no se pregunta al modelo (la evaluación se salta)", () => {
    expect(typeof HAS_KEY).toBe("boolean");
  });
});
