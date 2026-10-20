import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { customerSchema } from "@/features/customers/types";
import { payrollKeys } from "./queries";

/**
 * Lo del barbero además de su nómina del periodo (docs/API_CONTRACT.md, «Nómina › Del barbero» y «Equipo › Del
 * barbero»): estado de cuenta de la renta, certificado de ingresos, meta del ciclo, «Esto no cuadra», reputación y
 * clientes por volver. El servidor recorta al propio barbero; quien gestiona pide el de alguien con `memberId`.
 */

const runStatus = z.enum(["open", "approved", "paid"]);

export const rentStatementSchema = z.object({
  memberId: z.string(),
  name: z.string(),
  rows: z.array(z.object({ from: z.string(), to: z.string(), status: runStatus, held: z.number(), rent: z.number(), deductions: z.number(), adjustments: z.number(), paid: z.number(), paidOut: z.number().default(0), balance: z.number(), running: z.number() })),
  payments: z.array(z.object({ id: z.string(), amount: z.number(), method: z.string(), date: z.string(), note: z.string(), by: z.string() })),
  balance: z.number(),
});
export type RentStatement = z.infer<typeof rentStatementSchema>;

export const certificateSchema = z.object({
  memberId: z.string(),
  name: z.string(),
  generatedAt: z.string(),
  from: z.string(),
  to: z.string(),
  payout: z.enum(["commission", "rent", "salary"]),
  rows: z.array(z.object({ month: z.string(), from: z.string(), to: z.string(), services: z.number(), sales: z.number(), tips: z.number(), adjustments: z.number(), costs: z.number(), earned: z.number() })),
  totals: z.object({ services: z.number(), sales: z.number(), tips: z.number(), adjustments: z.number(), costs: z.number(), earned: z.number() }),
});
export type IncomeCertificate = z.infer<typeof certificateSchema>;

export const memberGoalSchema = z.object({
  cycle: z.object({ from: z.string(), to: z.string() }),
  goal: z.object({ serviceSales: z.number().nullable(), productSales: z.number().nullable(), rebookRate: z.number().nullable(), setBy: z.string(), setAt: z.string() }).nullable(),
  progress: z.object({ serviceSales: z.number(), productSales: z.number(), rebookRate: z.number(), visits: z.number() }),
  nextTier: z.object({ percent: z.number(), from: z.number(), missing: z.number(), currentPercent: z.number().nullable() }).nullable(),
});
export type MemberGoal = z.infer<typeof memberGoalSchema>;
export interface MemberGoalInput {
  serviceSales: number | null;
  productSales: number | null;
  rebookRate: number | null;
}

export const disputeSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  from: z.string(),
  to: z.string(),
  appointmentId: z.string().nullable(),
  appointmentLabel: z.string().nullable(),
  appointmentAt: z.string().nullable().optional(),
  message: z.string(),
  createdAt: z.string(),
  status: z.enum(["open", "answered"]),
  answer: z.string().nullable(),
  answeredBy: z.string().nullable(),
  answeredAt: z.string().nullable(),
});
export type PayDispute = z.infer<typeof disputeSchema>;

const reviewSchema = z.object({ id: z.string(), clientName: z.string(), rating: z.number(), comment: z.string(), createdAt: z.string(), sample: z.boolean() });
export const reputationSchema = z.object({
  rating: z.number().nullable(),
  total: z.number(),
  sample: z.boolean(),
  last90: z.object({ rating: z.number().nullable(), count: z.number() }),
  previous90: z.object({ rating: z.number().nullable(), count: z.number() }),
  distribution: z.array(z.object({ stars: z.number(), count: z.number() })),
  themes: z.array(z.object({ id: z.enum(["punctual", "cut", "beard", "care", "wait"]), tone: z.enum(["positive", "negative"]), count: z.number() })),
  recent: z.array(reviewSchema),
});
export type Reputation = z.infer<typeof reputationSchema>;

export const dueClientsSchema = z.object({
  items: z.array(customerSchema.extend({ daysSince: z.number().nullable() })),
  nextSlot: z.object({ day: z.string(), time: z.string(), serviceId: z.string() }).nullable(),
});
export type DueClients = z.infer<typeof dueClientsSchema>;

const barberKeys = {
  all: [...payrollKeys.all, "barber"] as const,
  disputes: [...payrollKeys.all, "disputes"] as const,
};

export function useRentStatement(branchId: string, memberId: string | null, cycles = 8) {
  return useQuery({
    queryKey: [...barberKeys.all, "statement", branchId, memberId, cycles],
    queryFn: ({ signal }) => api.get<RentStatement>("/payroll/rent-statement", { query: { branchId, memberId: memberId ?? undefined, cycles }, schema: rentStatementSchema, signal }),
    enabled: branchId !== "",
  });
}

export function useIncomeCertificate(params: { branchId: string; memberId: string | null; from: string; to: string }) {
  return useQuery({
    queryKey: [...barberKeys.all, "certificate", params],
    queryFn: ({ signal }) => api.get<IncomeCertificate>("/payroll/certificate", { query: { ...params, memberId: params.memberId ?? undefined }, schema: certificateSchema, signal }),
    enabled: params.branchId !== "" && params.from !== "" && params.to !== "",
  });
}

export function useMemberGoal(branchId: string, memberId: string | null) {
  return useQuery({
    queryKey: [...barberKeys.all, "goal", branchId, memberId],
    queryFn: ({ signal }) => api.get<MemberGoal>("/payroll/goals", { query: { branchId, memberId: memberId ?? undefined }, schema: memberGoalSchema, signal }),
    enabled: branchId !== "",
  });
}

export function useSetMemberGoal(branchId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberGoalInput) => api.put<MemberGoal>("/payroll/goals", { branchId, memberId, ...input }, { schema: memberGoalSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: barberKeys.all }),
  });
}

export function usePayDisputes(params: { branchId: string; memberId?: string | null; status?: "open" | "answered" }) {
  return useQuery({
    queryKey: [...barberKeys.disputes, params],
    queryFn: ({ signal }) => api.get("/payroll/disputes", { query: { branchId: params.branchId, memberId: params.memberId ?? undefined, status: params.status }, schema: z.object({ items: z.array(disputeSchema) }), signal }),
    enabled: params.branchId !== "",
  });
}

export function usePayDisputeActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: barberKeys.disputes });
  const create = useMutation({
    mutationFn: (input: { branchId: string; from: string; to: string; appointmentId: string | null; message: string }) => api.post<PayDispute>("/payroll/disputes", input, { schema: disputeSchema }),
    onSuccess: refresh,
  });
  const answer = useMutation({ mutationFn: ({ id, answer: text }: { id: string; answer: string }) => api.post<PayDispute>(`/payroll/disputes/${id}/answer`, { answer: text }, { schema: disputeSchema }), onSuccess: refresh });
  return { create, answer };
}

export function useReputation(memberId: string | null) {
  return useQuery({
    queryKey: ["team", "reputation", memberId],
    queryFn: ({ signal }) => api.get<Reputation>(`/team/members/${memberId}/reputation`, { schema: reputationSchema, signal }),
    enabled: Boolean(memberId),
  });
}

export function useDueClients(branchId: string, memberId: string | null) {
  return useQuery({
    queryKey: ["team", "due-clients", branchId, memberId],
    queryFn: ({ signal }) => api.get<DueClients>(`/team/members/${memberId}/due-clients`, { query: { branchId }, schema: dueClientsSchema, signal }),
    enabled: Boolean(memberId) && branchId !== "",
  });
}
