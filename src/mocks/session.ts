import { HttpResponse } from "msw";
import { ACCOUNTS, db, type MockAccount, type MockTeamRole } from "./db";

/**
 * Quién llama, visto por el servidor: la cuenta de la sesión con su rol en la barbería y su ficha
 * de equipo. Con esto cada endpoint recorta lo que devuelve y rechaza lo que el rol no puede hacer,
 * en vez de confiar en que la pantalla lo esconda (docs/API_CONTRACT.md, «Permisos en el servidor»).
 */
export interface MockSession {
  account: MockAccount;
  teamRole: MockTeamRole;
  memberId: string;
}

export function sessionOf(request: Request): MockSession | null {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const accountId = token ? db.sessions.get(token) : undefined;
  const account = ACCOUNTS.find((item) => item.id === accountId);
  return account ? { account, teamRole: account.user.teamRole, memberId: account.user.memberId } : null;
}

/** Dueño o administrador: gestionan la sucursal (nómina, configuración, equipo). */
export const isManager = (session: MockSession): boolean => session.teamRole === "owner" || session.teamRole === "admin";
export const isBarber = (session: MockSession): boolean => session.teamRole === "barbero-comision" || session.teamRole === "barbero-renta";

export const unauthorized = () => HttpResponse.json({ code: "unauthorized", message: "Tu sesión expiró." }, { status: 401 });
export const forbidden = (message = "Tu rol no puede hacer esto.") => HttpResponse.json({ code: "forbidden", message }, { status: 403 });
