import { delay, http, HttpResponse, type DefaultBodyType } from "msw";
import { db } from "../db";
import { forbidden, isManager, sessionOf, unauthorized } from "../session";
import { legalVersion, type LegalDocId } from "@/features/legal/documents";

/**
 * Lo que la barbería aceptó de los documentos legales (docs/API_CONTRACT.md, «Legal»): el acuerdo de
 * encargo de datos con su versión, la fecha y quién. Vive con los datos de la empresa en Configuración.
 */

const BASE = "*/api";
const LATENCY_MS = 150;

export interface MockLegalAcceptance {
  version: string;
  at: string;
  by: string;
}
type Acceptances = Partial<Record<LegalDocId, MockLegalAcceptance>>;

const asRecord = (body: DefaultBodyType): Record<string, unknown> => (body && typeof body === "object" ? (body as Record<string, unknown>) : {});
const acceptances = (): Acceptances => ((db.settings.sections.company as { legalAcceptances?: Acceptances }).legalAcceptances ?? {}) as Acceptances;
const current = () => ({ terms: legalVersion("terms"), privacy: legalVersion("privacy"), dpa: legalVersion("dpa") });

const view = () => ({ current: current(), dpa: acceptances().dpa ?? null, terms: acceptances().terms ?? null });

export const legalHandlers = [
  http.get(`${BASE}/legal/acceptances`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Los acuerdos de la barbería los ve el dueño o un administrador.");
    return HttpResponse.json(view());
  }),

  // Aceptar el acuerdo de encargo: solo la versión vigente, por el dueño o un administrador.
  http.post(`${BASE}/legal/dpa/accept`, async ({ request }) => {
    await delay(LATENCY_MS);
    const session = sessionOf(request);
    if (!session) return unauthorized();
    if (!isManager(session)) return forbidden("Solo el dueño o un administrador puede aceptarlo.");
    const version = asRecord(await request.json().catch(() => ({}))).version;
    if (version !== legalVersion("dpa")) return HttpResponse.json({ code: "outdated_version", message: "Hay una versión nueva del acuerdo: recarga y revísala.", fields: { version: ["Versión vencida."] } }, { status: 422 });
    const company = db.settings.sections.company as Record<string, unknown>;
    db.settings.sections.company = { ...company, legalAcceptances: { ...acceptances(), dpa: { version, at: new Date().toISOString(), by: session.account.user.name } } };
    db.persist();
    return HttpResponse.json(view());
  }),
];
