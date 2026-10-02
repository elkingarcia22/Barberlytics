import { isApiError } from "@/lib/api";
import { ROLE_DEFAULT_PERMISSIONS } from "./permissionsCatalog";
import { isBarberRole, profileInputSchema, type Compensation, type MemberDraft, type MemberOptions, type MemberPatch, type MemberTab, type Payments, type ProfileInput, type TeamMember, type TeamRole, type WeekSchedule } from "./types";

/**
 * El borrador de una persona: lo que se llena al crearla, pestaña por
 * pestaña, y lo que se manda al guardar una pestaña de la ficha. Aquí viven
 * los valores con los que arranca cada bloque y las validaciones de cliente.
 */

export const emptyProfile = (): ProfileInput => ({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  description: "",
  bookingVisible: true,
  levelId: null,
  skills: [],
  gallery: [],
  avatarUrl: null,
  isAlsoBarber: false,
});

export const defaultCompensation = (): Compensation => ({ type: "commission", basic: 40, recurring: null, walkIn: null, noPreference: null, newClient: null, productPercent: null, salary: null, scale: [] });

export const defaultPayments = (): Payments => ({ rentBase: 0, walkInDeduction: 0, newClientDeduction: 0, noPreferenceDeduction: 0, bankName: "", accountNumber: "" });

export const defaultOptions = (): MemberOptions => ({
  tips: true,
  multipleAppointments: false,
  newClients: true,
  clientCancel: { enabled: false, channels: [], hours: 2, minutes: 0 },
  intervalMinutes: 30,
  reminders: [{ channel: "push", hours: 0, minutes: 15 }],
  social: "",
  link: "",
});

/** Lunes a sábado de 9 a 18 para un barbero; nada para un gerente. */
export const defaultSchedule = (role: TeamRole): WeekSchedule =>
  Object.fromEntries(["0", "1", "2", "3", "4", "5", "6"].map((day) => [day, isBarberRole(role) && day !== "0" ? { start: "09:00", end: "18:00" } : null]));

export function draftFromRole(role: TeamRole, branchId: string): MemberDraft {
  return {
    role,
    branchId,
    profile: emptyProfile(),
    services: [],
    compensation: role === "barbero-comision" ? defaultCompensation() : null,
    payments: role === "barbero-renta" ? defaultPayments() : null,
    schedule: defaultSchedule(role),
    permissions: ROLE_DEFAULT_PERMISSIONS[role],
    options: defaultOptions(),
  };
}

export const profileFromMember = (member: TeamMember): ProfileInput => ({
  firstName: member.firstName,
  lastName: member.lastName,
  phone: member.phone,
  email: member.email,
  description: member.description,
  bookingVisible: member.bookingVisible,
  levelId: member.levelId,
  skills: member.skills,
  gallery: member.gallery,
  avatarUrl: member.avatarUrl,
  isAlsoBarber: member.isAlsoBarber,
});

/** El borrador de una ficha existente: cada pestaña con lo que hoy tiene. */
export function draftFromMember(member: TeamMember): MemberDraft {
  return {
    role: member.role,
    branchId: member.homeBranchId,
    profile: profileFromMember(member),
    services: member.services,
    compensation: member.compensation ?? (member.role === "barbero-comision" ? defaultCompensation() : null),
    payments: member.payments ?? (member.role === "barbero-renta" ? defaultPayments() : null),
    schedule: member.schedule,
    permissions: member.permissions,
    options: member.options,
  };
}

/** Lo que se manda al guardar una pestaña. */
export function patchForTab(tab: MemberTab, draft: MemberDraft): MemberPatch {
  if (tab === "profile") return { ...draft.profile };
  if (tab === "services") return { services: draft.services };
  if (tab === "compensation") return draft.compensation ? { compensation: draft.compensation } : {};
  if (tab === "payments") return draft.payments ? { payments: draft.payments } : {};
  if (tab === "schedule") return { schedule: draft.schedule };
  if (tab === "permissions") return { permissions: draft.permissions };
  return { options: draft.options };
}

/** Errores de cliente de una pestaña; vacío si todo está bien. */
export function validateTab(tab: MemberTab, draft: MemberDraft): Record<string, string> {
  if (tab === "profile") {
    const parsed = profileInputSchema.safeParse(draft.profile);
    const errors: Record<string, string> = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
    if (isBarberRole(draft.role) && !draft.profile.levelId) errors.levelId = "Elige el nivel del barbero";
    return errors;
  }
  if (tab === "compensation" && draft.compensation && draft.compensation.type !== "salary" && (draft.compensation.basic <= 0 || draft.compensation.basic > 100)) {
    return { basic: "La comisión básica va de 1 a 100 %" };
  }
  if (tab === "schedule") {
    const invalid = Object.values(draft.schedule).some((range) => range && range.end <= range.start);
    return invalid ? { schedule: "La hora de cierre debe ser posterior a la de inicio." } : {};
  }
  return {};
}

/** Los errores por campo que mandó el servidor, listos para pintar. */
export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || !error.fieldErrors) return {};
  return Object.fromEntries(Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]]));
}
