import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";
import { calendarKeys } from "@/features/calendar/queries";

/**
 * El equipo en operación: a quién le toca, ausencias, rendimiento y portada. Contrato en
 * docs/API_CONTRACT.md («Equipo»).
 */

const turnSchema = z.object({
  kind: z.enum(["walkIn", "noPreference"]),
  next: z.string().nullable(),
  items: z.array(z.object({ memberId: z.string(), name: z.string(), avatarUrl: z.string().nullable(), position: z.number(), count: z.number(), working: z.boolean(), free: z.boolean() })),
});
export type LineupTurn = z.infer<typeof turnSchema>;

export const absenceKindSchema = z.enum(["vacation", "sick", "personal"]);
export type AbsenceKind = z.infer<typeof absenceKindSchema>;
const absenceSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  branchId: z.string(),
  kind: absenceKindSchema,
  startDate: z.string(),
  endDate: z.string(),
  note: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  requestedBy: z.string(),
  requestedAt: z.string(),
  decidedBy: z.string().nullable(),
  decidedAt: z.string().nullable(),
  reason: z.string().nullable(),
  affected: z.array(z.object({ id: z.string(), start: z.string(), client: z.string() })),
});
export type Absence = z.infer<typeof absenceSchema>;

const performanceSchema = z.object({
  memberId: z.string(),
  days: z.number(),
  services: z.number(),
  occupancy: z.number(),
  rebookRate: z.number(),
  retention: z.number(),
  avgTicket: z.number(),
  productsPerService: z.number(),
  tips: z.number(),
  noShows: z.number(),
  noShowRate: z.number(),
  rating: z.number().nullable(),
  reviews: z.number(),
});
export type MemberPerformance = z.infer<typeof performanceSchema>;

const homeSchema = z.object({
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.enum(["owner", "admin", "recepcion", "barbero-comision", "barbero-renta"]),
      branchId: z.string(),
      status: z.enum(["active", "invited", "inactive"]),
      chair: z.number().nullable(),
      occupancy: z.number().nullable(),
      services: z.number().nullable(),
      revenue: z.number().nullable(),
      payout: z.number().nullable(),
      retention: z.number().nullable(),
      rentDueOffset: z.number().nullable(),
      openRegisters: z.number(),
      lastActiveOffset: z.number().nullable(),
    })
  ),
  openShifts: z.array(z.object({ id: z.string(), dayOffset: z.number(), slot: z.string(), branchId: z.string(), chair: z.number(), reason: absenceKindSchema, memberName: z.string() })),
  series: z.record(z.string(), z.array(z.number())),
  pendingAbsences: z.number(),
  absentToday: z.array(z.object({ memberId: z.string(), name: z.string() })),
});
export type TeamHomeData = z.infer<typeof homeSchema>;

export const ABSENCE_KIND_KEYS: Readonly<Record<AbsenceKind, AppMessageKey>> = { vacation: "team.absence.kind.vacation", sick: "team.absence.kind.sick", personal: "team.absence.kind.personal" };
export const ABSENCE_STATUS_KEYS: Readonly<Record<Absence["status"], AppMessageKey>> = { pending: "team.absence.status.pending", approved: "team.absence.status.approved", rejected: "team.absence.status.rejected" };

const keys = {
  turn: (branchId: string, kind: string) => ["team", "turn", branchId, kind] as const,
  home: (branchId: string) => ["team", "home", branchId] as const,
  performance: (id: string, branchId: string) => ["team", "performance", id, branchId] as const,
  absences: (branchId: string) => ["team", "absences", branchId] as const,
};

export function useLineupTurn(branchId: string, kind: "walkIn" | "noPreference", enabled = true) {
  return useQuery({ queryKey: keys.turn(branchId, kind), queryFn: ({ signal }) => api.get("/team/lineup/turn", { query: { branchId, kind }, schema: turnSchema, signal }), enabled, refetchInterval: 60_000 });
}

export function useTeamHome(branchId: string) {
  return useQuery({ queryKey: keys.home(branchId), queryFn: ({ signal }) => api.get("/team/home", { query: { branchId }, schema: homeSchema, signal }) });
}

export function useMemberPerformance(memberId: string, branchId: string) {
  return useQuery({ queryKey: keys.performance(memberId, branchId), queryFn: ({ signal }) => api.get(`/team/members/${memberId}/performance`, { query: { branchId }, schema: performanceSchema, signal }) });
}

export function useAbsences(branchId: string) {
  return useQuery({ queryKey: keys.absences(branchId), queryFn: ({ signal }) => api.get("/team/absences", { query: { branchId }, schema: z.object({ items: z.array(absenceSchema) }), signal }) });
}

/** Una ausencia aprobada bloquea la agenda: se refrescan el equipo y el calendario. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["team"] });
    void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
  };
}

export interface AbsenceInput {
  memberId?: string;
  branchId: string;
  kind: AbsenceKind;
  startDate: string;
  endDate: string;
  note: string;
}

export function useRequestAbsence() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (input: AbsenceInput) => api.post<Absence>("/team/absences", input, { schema: absenceSchema }), onSuccess: refresh });
}

export function useDecideAbsence() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: "approve" | "reject"; reason?: string }) => api.post<Absence>(`/team/absences/${id}/${decision}`, { reason }, { schema: absenceSchema }),
    onSuccess: refresh,
  });
}

export function useCancelAbsence() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (id: string) => api.delete<void>(`/team/absences/${id}`), onSuccess: refresh });
}
