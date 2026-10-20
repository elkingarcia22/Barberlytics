import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { workingRangeSchema } from "../types";

/**
 * La operación del equipo (docs/API_CONTRACT.md, «Equipo › Fichaje», «Turnos», «Niveles y forma de pago»): fichar, la
 * hoja de horas, los turnos abiertos y los cambios, el avance a cada nivel, el cambio de forma de pago con fecha y el
 * pedido de reseñas del barbero.
 */

const timeEntrySchema = z.object({ id: z.string(), branchId: z.string(), memberId: z.string(), clockIn: z.string(), clockOut: z.string().nullable(), by: z.string() });
export type TimeEntry = z.infer<typeof timeEntrySchema>;

export const clockStatusSchema = z.object({
  canClock: z.boolean(),
  branchId: z.string(),
  open: timeEntrySchema.nullable(),
  today: z.array(timeEntrySchema),
  shift: z.object({ start: z.string(), end: z.string() }).nullable(),
});
export type ClockStatus = z.infer<typeof clockStatusSchema>;

export const timesheetSchema = z.object({
  from: z.string(),
  to: z.string(),
  rows: z.array(
    z.object({
      memberId: z.string(),
      name: z.string(),
      role: z.string(),
      workedMinutes: z.number(),
      scheduledMinutes: z.number(),
      daysWorked: z.number(),
      lateDays: z.array(z.string()),
      absentDays: z.array(z.string()),
      open: timeEntrySchema.nullable(),
      entries: z.array(timeEntrySchema),
    })
  ),
});
export type Timesheet = z.infer<typeof timesheetSchema>;

export const shiftRequestSchema = z.object({
  id: z.string(),
  kind: z.enum(["cover", "swap"]),
  requesterId: z.string(),
  requesterName: z.string(),
  date: z.string(),
  range: workingRangeSchema,
  absentMemberId: z.string().nullable().optional(),
  withMemberId: z.string().nullable().optional(),
  withName: z.string().nullable().optional(),
  withDate: z.string().nullable().optional(),
  withRange: workingRangeSchema.nullable().optional(),
  status: z.enum(["pending", "accepted", "approved", "rejected", "cancelled"]),
  createdAt: z.string(),
  decidedBy: z.string().nullable(),
  decidedAt: z.string().nullable(),
  reason: z.string().nullable(),
});
export type ShiftRequest = z.infer<typeof shiftRequestSchema>;

export const shiftsSchema = z.object({
  open: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      absenceId: z.string(),
      memberId: z.string(),
      memberName: z.string(),
      reason: z.enum(["vacation", "sick", "personal"]),
      range: workingRangeSchema,
      /** Quién está libre ese día para cubrirlo. */
      available: z.array(z.object({ memberId: z.string(), name: z.string() })).default([]),
      requests: z.array(z.object({ id: z.string(), requesterId: z.string(), requesterName: z.string() })),
    })
  ),
  requests: z.array(shiftRequestSchema),
});
export type Shifts = z.infer<typeof shiftsSchema>;
export type OpenShift = Shifts["open"][number];

const levelCheckSchema = z.object({ id: z.enum(["services90", "rebookRate", "rating", "months"]), need: z.number(), have: z.number().nullable(), met: z.boolean() });
export const levelProgressSchema = z.object({
  memberId: z.string(),
  name: z.string(),
  level: z.object({ id: z.string(), name: z.string() }).nullable(),
  next: z.object({ id: z.string(), name: z.string(), priceFactor: z.number() }).nullable(),
  have: z.object({ services90: z.number(), rebookRate: z.number(), rating: z.number().nullable(), months: z.number() }),
  checks: z.array(levelCheckSchema),
  ready: z.boolean(),
});
export type LevelProgress = z.infer<typeof levelProgressSchema>;
export type LevelCheck = z.infer<typeof levelCheckSchema>;

export const levelRulesSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceFactor: z.number().optional(),
  criteria: z.object({ services90: z.number().nullable(), rebookRate: z.number().nullable(), rating: z.number().nullable(), months: z.number().nullable() }).optional(),
});
export type LevelRules = z.infer<typeof levelRulesSchema>;
export type LevelCriteria = NonNullable<LevelRules["criteria"]>;

export const payoutChangeSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  effectiveDate: z.string(),
  from: z.string(),
  to: z.string(),
  status: z.enum(["scheduled", "applied", "cancelled"]),
  note: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  after: z.object({ compensation: z.object({ type: z.string(), basic: z.number(), salary: z.number().nullable() }).passthrough().nullable(), payments: z.object({ rentBase: z.number() }).passthrough().nullable() }),
});
export type PayoutChange = z.infer<typeof payoutChangeSchema>;
export type PayoutTarget = "commission" | "salary" | "rent";

const reviewCandidateSchema = z.object({ appointmentId: z.string(), clientId: z.string(), name: z.string(), at: z.string() });

const keys = {
  clock: ["team", "clock"] as const,
  shifts: ["team", "shifts"] as const,
  levels: ["team", "levels"] as const,
};

export function useClockStatus(branchId: string, enabled = true) {
  return useQuery({ queryKey: [...keys.clock, "me", branchId], queryFn: ({ signal }) => api.get<ClockStatus>("/team/clock/me", { query: { branchId }, schema: clockStatusSchema, signal }), enabled });
}

export function useClockAction(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "in" | "out") => api.post<ClockStatus>("/team/clock", { branchId, action }, { schema: clockStatusSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.clock }),
  });
}

export function useTimesheet(branchId: string, from: string, to: string, enabled = true) {
  return useQuery({ queryKey: [...keys.clock, "sheet", branchId, from, to], queryFn: ({ signal }) => api.get<Timesheet>("/team/timesheet", { query: { branchId, from, to }, schema: timesheetSchema, signal }), enabled });
}

export function useShifts(branchId: string) {
  return useQuery({ queryKey: [...keys.shifts, branchId], queryFn: ({ signal }) => api.get<Shifts>("/team/shifts", { query: { branchId }, schema: shiftsSchema, signal }) });
}

export function useShiftActions() {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: keys.shifts }), queryClient.invalidateQueries({ queryKey: ["team"] })]);
  return {
    cover: useMutation({ mutationFn: (shiftId: string) => api.post<ShiftRequest>("/team/shifts/cover", { shiftId }, { schema: shiftRequestSchema }), onSuccess: refresh }),
    assign: useMutation({ mutationFn: (input: { shiftId: string; memberId: string }) => api.post<ShiftRequest>("/team/shifts/assign", input, { schema: shiftRequestSchema }), onSuccess: refresh }),
    swap: useMutation({ mutationFn: (input: { date: string; withMemberId: string; withDate: string }) => api.post<ShiftRequest>("/team/shifts/swap", input, { schema: shiftRequestSchema }), onSuccess: refresh }),
    act: useMutation({ mutationFn: ({ id, action, reason }: { id: string; action: "accept" | "decline" | "approve" | "reject"; reason?: string }) => api.post<ShiftRequest>(`/team/shifts/requests/${id}/${action}`, { reason }, { schema: shiftRequestSchema }), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: (id: string) => api.delete<void>(`/team/shifts/requests/${id}`), onSuccess: refresh }),
  };
}

export function useLevelProgress(branchId: string) {
  return useQuery({ queryKey: [...keys.levels, "progress", branchId], queryFn: ({ signal }) => api.get("/team/levels/progress", { query: { branchId }, schema: z.object({ items: z.array(levelProgressSchema) }), signal }) });
}

export function useLevelActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["team"] });
  return {
    rules: useMutation({ mutationFn: ({ id, priceFactor, criteria }: { id: string; priceFactor: number; criteria: LevelCriteria }) => api.put<LevelRules>(`/team/levels/${id}/rules`, { priceFactor, criteria }, { schema: levelRulesSchema }), onSuccess: refresh }),
    promote: useMutation({ mutationFn: ({ memberId, levelId, reprice }: { memberId: string; levelId: string; reprice: boolean }) => api.post(`/team/members/${memberId}/promote`, { levelId, reprice }), onSuccess: refresh }),
  };
}

export function usePayoutChanges(memberId: string, enabled = true) {
  return useQuery({ queryKey: ["team", "payout-changes", memberId], queryFn: ({ signal }) => api.get(`/team/members/${memberId}/payout-changes`, { schema: z.object({ items: z.array(payoutChangeSchema) }), signal }), enabled });
}

export function usePayoutChangeActions(memberId: string) {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["team"] }), queryClient.invalidateQueries({ queryKey: ["payroll"] })]);
  return {
    create: useMutation({ mutationFn: (input: { to: PayoutTarget; effectiveDate: string; amount: number | null; note: string }) => api.post<PayoutChange>(`/team/members/${memberId}/payout-change`, input, { schema: payoutChangeSchema }), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: (id: string) => api.delete<void>(`/team/payout-changes/${id}`), onSuccess: refresh }),
  };
}

export function useReviewCandidates(branchId: string, memberId: string | null) {
  return useQuery({
    queryKey: ["team", "review-candidates", branchId, memberId],
    queryFn: ({ signal }) => api.get(`/team/members/${memberId}/review-candidates`, { query: { branchId }, schema: z.object({ items: z.array(reviewCandidateSchema) }), signal }),
    enabled: Boolean(memberId),
  });
}

export function useRequestReviews(branchId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ sent: number }>(`/team/members/${memberId}/review-requests`, { branchId }, { schema: z.object({ sent: z.number() }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team", "review-candidates"] }),
  });
}
