import { isManager, type MockSession } from "../session";
import type { MockTeamMember, MockTeamRole } from "./seed";

/**
 * Quién puede tocar a quién en el equipo, visto por el servidor (docs/API_CONTRACT.md, «Equipo»), y cómo
 * sale la cuenta bancaria: siempre enmascarada; el número completo solo con `GET …/bank` y la identidad
 * confirmada.
 */

/** Más arriba manda: el dueño a todos, el administrador a recepción y barberos. */
const RANK: Readonly<Record<MockTeamRole, number>> = { owner: 0, admin: 1, recepcion: 2, "barbero-comision": 3, "barbero-renta": 3 };

/** Si quien llama gestiona a alguien de ese rol (crear, editar, desactivar, recordar). */
export const managesMember = (session: MockSession, role: MockTeamRole): boolean => isManager(session) && (session.teamRole === "owner" || RANK[role] > RANK[session.teamRole]);

/** Lo que cada quien cambia de su propia ficha sin pedírselo a nadie: cómo se presenta y cómo se le contacta. */
export const SELF_EDITABLE: ReadonlySet<string> = new Set(["firstName", "lastName", "phone", "email", "description", "instagram", "facebook", "avatarUrl", "skills", "gallery"]);
/** El barbero de renta además lleva su negocio: su horario, sus precios, sus opciones y si sale en la reserva. */
export const RENTER_SELF_EDITABLE: ReadonlySet<string> = new Set([...SELF_EDITABLE, "schedule", "services", "options", "bookingVisible"]);

const MASK = "••••";

/** «•••• 4821»: lo que se ve de una cuenta bancaria. */
export const maskAccount = (number: string): string => {
  const digits = number.replace(/\s/g, "");
  return digits ? `${MASK} ${digits.slice(-4)}` : "";
};

/** Si lo que llega es la cuenta enmascarada (no se cambió). */
export const isMaskedAccount = (value: unknown): boolean => typeof value === "string" && value.startsWith(MASK);

/** La ficha con la cuenta bancaria enmascarada: así sale siempre del servidor. */
export const withMaskedBank = (member: MockTeamMember): MockTeamMember =>
  member.payments ? { ...member, payments: { ...member.payments, accountNumber: maskAccount(member.payments.accountNumber) } } : member;

/** Lo que ve de un colega quien no gestiona al equipo: sin contacto ni dinero. */
export const redactFor = (session: MockSession | null, member: MockTeamMember): MockTeamMember =>
  session && !isManager(session) && member.id !== session.memberId ? { ...member, phone: "", email: "", code: "", compensation: null, payments: null } : withMaskedBank(member);
