import { z } from "zod";
import { env } from "@/lib/api";

/**
 * Lo que habla la tablet del kiosco con el servidor. No usa la sesión de nadie: manda su propio token
 * (`X-Kiosk-Token`), que recibe al emparejarse con el código de Configuración y guarda en el
 * dispositivo. Si el servidor dice que ya no vale (lo desactivaron), se borra y vuelve a pedir código.
 */

const TOKEN_KEY = "thema.kiosk.token";

export const kioskToken = {
  get: (): string | null => {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* sin almacenamiento, el kiosco pide el código cada vez */
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nada que borrar */
    }
  },
};

export class KioskError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "KioskError";
    this.status = status;
    this.code = code;
  }
}

async function call<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const token = kioskToken.get();
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("x-kiosk-token", token);
  const response = await fetch(`${env.apiUrl}${path}`, { ...init, headers });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = (body ?? {}) as { code?: string; message?: string };
    if (response.status === 401) kioskToken.clear();
    throw new KioskError(response.status, record.code ?? "error", record.message ?? "Algo falló. Pregunta en recepción.");
  }
  return schema.parse(body);
}

const meSchema = z.object({
  device: z.object({ id: z.string(), name: z.string() }),
  branch: z.object({ id: z.string(), name: z.string() }),
  phoneCountry: z.string().nullable(),
  shopName: z.string(),
  services: z.array(z.object({ id: z.string(), name: z.string(), durationMin: z.number() })),
  barbers: z.array(z.object({ id: z.string(), firstName: z.string(), avatarUrl: z.string().nullable() })),
  queue: z.object({ waiting: z.number(), waitMin: z.number().nullable(), waitMax: z.number().nullable() }),
});
export type KioskInfo = z.infer<typeof meSchema>;

const pairSchema = z.object({ token: z.string(), device: z.object({ id: z.string(), name: z.string() }), branch: z.object({ id: z.string(), name: z.string() }) });
const lookupSchema = z.object({ appointments: z.array(z.object({ id: z.string(), time: z.string(), firstName: z.string() })) });
export type KioskAppointment = z.infer<typeof lookupSchema>["appointments"][number];
const checkInSchema = z.object({ firstName: z.string(), time: z.string(), barberFirstName: z.string().nullable() });
export type KioskCheckIn = z.infer<typeof checkInSchema>;
const joinSchema = z.object({ id: z.string(), firstName: z.string(), position: z.number(), waitMin: z.number().nullable(), waitMax: z.number().nullable(), barberFirstName: z.string().nullable() });
export type KioskJoined = z.infer<typeof joinSchema>;

const boardSchema = z.object({
  branch: z.object({ id: z.string(), name: z.string() }),
  shopName: z.string(),
  called: z.array(z.object({ id: z.string(), firstName: z.string(), barberFirstName: z.string().nullable(), calledAt: z.string().nullable() })),
  next: z.array(z.object({ id: z.string(), position: z.number(), firstName: z.string(), waitMin: z.number().nullable(), waitMax: z.number().nullable() })),
  waiting: z.number(),
});
export type TurnBoard = z.infer<typeof boardSchema>;

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const kioskApi = {
  pair: async (code: string) => {
    const result = await call("/kiosk/pair", pairSchema, post({ code }));
    kioskToken.set(result.token);
    return result;
  },
  me: () => call("/kiosk/me", meSchema),
  board: () => call("/kiosk/board", boardSchema),
  lookup: (phone: string) => call("/kiosk/lookup", lookupSchema, post({ phone })),
  checkIn: (appointmentId: string, phone: string) => call("/kiosk/check-in", checkInSchema, post({ appointmentId, phone })),
  join: (input: { firstName: string; phone?: string; serviceIds: string[]; barberId: string | null }) => call("/kiosk/queue", joinSchema, post(input)),
};
