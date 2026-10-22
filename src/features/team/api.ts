import { z } from "zod";
import { api } from "@/lib/api";
import {
  branchOrderSchema,
  levelSchema,
  levelsResponseSchema,
  memberSchema,
  membersResponseSchema,
  closuresResponseSchema,
  scheduleImpactSchema,
  scheduleLogSchema,
  schedulePlanSchema,
  scheduleTemplateSchema,
  type ClosureInput,
  type ClosuresResponse,
  type PlanInput,
  type SchedulePlan,
  type ScheduleTemplate,
  scheduleOverrideSchema,
  weekResponseSchema,
  workingRangeSchema,
  type ScheduleImpact,
  type ShiftScope,
  type BranchOrder,
  type Level,
  type MemberDraft,
  type MemberPatch,
  type MembersResponse,
  type TeamMember,
  type WeekResponse,
  type WorkingRange,
} from "./types";

const skipSchema = <T extends [string, ...string[]]>(reasons: T) => z.object({ id: z.string(), name: z.string(), reason: z.enum(reasons) });
const remindResultSchema = z.object({ sent: z.number(), simulated: z.boolean().optional(), skipped: z.array(skipSchema(["notInvited", "recent", "forbidden"])) });
const deactivateResultSchema = z.object({ deactivated: z.array(z.object({ id: z.string(), name: z.string(), upcoming: z.number() })), skipped: z.array(skipSchema(["self", "forbidden", "inactive"])) });
const importResultSchema = z.object({ created: z.array(z.object({ id: z.string(), name: z.string() })), rejected: z.array(z.object({ row: z.number(), message: z.string() })) });
export type RemindResult = z.infer<typeof remindResultSchema>;
export type DeactivateResult = z.infer<typeof deactivateResultSchema>;
export type ImportMembersResult = z.infer<typeof importResultSchema>;

/** Una fila de «Cargar miembros». */
export interface MemberImportRow {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: "barbero-comision" | "barbero-renta" | "recepcion";
}

/** Contrato del equipo; ver docs/API_CONTRACT.md. */
export const teamApi = {
  members: (branchId: string, all = false, signal?: AbortSignal) =>
    api.get<MembersResponse>("/team/members", { query: { branchId, all: all ? "true" : undefined }, schema: membersResponseSchema, signal }),
  member: (id: string, signal?: AbortSignal) => api.get<TeamMember>(`/team/members/${id}`, { schema: memberSchema, signal }),
  createMember: (draft: MemberDraft) =>
    api.post<TeamMember>(
      "/team/members",
      { role: draft.role, branchId: draft.branchId, ...draft.profile, services: draft.services, compensation: draft.compensation, payments: draft.payments, schedule: draft.schedule, permissions: draft.permissions, options: draft.options },
      { schema: memberSchema }
    ),
  updateMember: (id: string, patch: MemberPatch) => api.patch<TeamMember>(`/team/members/${id}`, patch, { schema: memberSchema }),
  removeMember: (id: string) => api.delete<void>(`/team/members/${id}`),
  /** Recordar la invitación (solo a invitados, una vez al día). */
  remind: (ids: readonly string[]) => api.post("/team/members/remind", { ids }, { schema: remindResultSchema }),
  /** Desactivar en lote: dice cuántas citas por venir tiene cada quien para reasignarlas. */
  deactivate: (ids: readonly string[]) => api.post("/team/members/deactivate", { ids }, { schema: deactivateResultSchema }),
  /** Cargar una lista: entran invitados; lo que no sirve vuelve con su fila y su motivo. */
  importMembers: (branchId: string, items: readonly MemberImportRow[]) => api.post("/team/members/import", { branchId, items }, { schema: importResultSchema }),
  /** El número completo de la cuenta; pide confirmar la identidad (el cliente de la API la pide y reintenta). */
  bank: (id: string) => api.get(`/team/members/${id}/bank`, { schema: z.object({ bankName: z.string(), accountNumber: z.string() }) }),
  setActivation: (branchId: string, memberIds: string[]) => api.put<MembersResponse>("/team/activation", { branchId, memberIds }, { schema: membersResponseSchema }),

  levels: (signal?: AbortSignal) => api.get<{ items: Level[] }>("/team/levels", { schema: levelsResponseSchema, signal }),
  createLevel: (name: string) => api.post<Level>("/team/levels", { name }, { schema: levelSchema }),
  updateLevel: (id: string, name: string) => api.patch<Level>(`/team/levels/${id}`, { name }, { schema: levelSchema }),
  removeLevel: (id: string) => api.delete<void>(`/team/levels/${id}`),

  order: (branchId: string, signal?: AbortSignal) => api.get<BranchOrder>("/team/order", { query: { branchId }, schema: branchOrderSchema, signal }),
  saveOrder: (order: BranchOrder) => api.put<BranchOrder>("/team/order", order, { schema: branchOrderSchema }),

  week: (branchId: string, weekStart: string, signal?: AbortSignal) =>
    api.get<WeekResponse>("/team/schedule", { query: { branchId, week: weekStart }, schema: weekResponseSchema, signal }),
  setOverride: (memberId: string, date: string, range: WorkingRange | null, notify = true) =>
    api.put("/team/schedule/override", { memberId, date, range, notify }, { schema: scheduleOverrideSchema }),
  clearOverride: (memberId: string, date: string, notify = true) => api.delete<void>("/team/schedule/override", { query: { memberId, date, notify: notify ? undefined : "false" } }),
  /** «Este y los siguientes»: un horario nuevo desde esa fecha con ese día de la semana cambiado (lo anterior no se toca). */
  setWeekday: (memberId: string, from: string, range: WorkingRange | null, notify = true) => api.put("/team/schedule/weekday", { memberId, from, range, notify }, { schema: z.object({ memberId: z.string(), weekday: z.string(), range: workingRangeSchema.nullable() }) }),
  plans: (branchId: string, signal?: AbortSignal) => api.get<{ items: SchedulePlan[] }>("/team/schedule/plans", { query: { branchId }, schema: z.object({ items: z.array(schedulePlanSchema) }), signal }),
  createPlan: (input: PlanInput) => api.post("/team/schedule/plans", input, { schema: z.object({ created: z.number() }) }),
  removePlan: (id: string) => api.delete<void>(`/team/schedule/plans/${id}`),
  templates: (branchId: string, signal?: AbortSignal) => api.get<{ items: ScheduleTemplate[] }>("/team/schedule/templates", { query: { branchId }, schema: z.object({ items: z.array(scheduleTemplateSchema) }), signal }),
  removeTemplate: (id: string) => api.delete<void>(`/team/schedule/templates/${id}`),
  closures: (branchId: string, year: number, signal?: AbortSignal) => api.get<ClosuresResponse>("/team/schedule/closures", { query: { branchId, year: String(year) }, schema: closuresResponseSchema, signal }),
  setHoliday: (branchId: string, date: string, closed: boolean) => api.put("/team/schedule/holidays", { branchId, date, closed }, { schema: z.object({ date: z.string(), closed: z.boolean() }) }),
  addClosure: (input: ClosureInput) => api.post("/team/schedule/closures", input, { schema: z.object({ id: z.string() }) }),
  removeClosure: (id: string) => api.delete<void>(`/team/schedule/closures/${id}`),
  closureImpact: (input: ClosureInput, signal?: AbortSignal) => api.post<{ items: ScheduleImpact[] }>("/team/schedule/closures/impact", input, { schema: scheduleImpactSchema, signal }),
  log: (branchId: string, signal?: AbortSignal) => api.get("/team/schedule/log", { query: { branchId }, schema: scheduleLogSchema, signal }),
  /** Las citas por atender que quedarían fuera del turno nuevo. */
  impact: (input: { memberId: string; date: string; range: WorkingRange | null; scope: ShiftScope }, signal?: AbortSignal) =>
    api.post<{ items: ScheduleImpact[] }>("/team/schedule/impact", input, { schema: scheduleImpactSchema, signal }),
  /** Copiar los turnos de una semana a otra (lunes AAAA-MM-DD). */
  copyWeek: (branchId: string, from: string, to: string) => api.post("/team/schedule/copy-week", { branchId, from, to }, { schema: z.object({ changed: z.number(), members: z.array(z.string()) }) }),
};
