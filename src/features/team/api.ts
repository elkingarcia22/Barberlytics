import { api } from "@/lib/api";
import {
  branchOrderSchema,
  levelSchema,
  levelsResponseSchema,
  memberSchema,
  membersResponseSchema,
  scheduleOverrideSchema,
  weekResponseSchema,
  type BranchOrder,
  type Level,
  type MemberDraft,
  type MemberPatch,
  type MembersResponse,
  type TeamMember,
  type WeekResponse,
  type WorkingRange,
} from "./types";

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
  setActivation: (branchId: string, memberIds: string[]) => api.put<MembersResponse>("/team/activation", { branchId, memberIds }, { schema: membersResponseSchema }),

  levels: (signal?: AbortSignal) => api.get<{ items: Level[] }>("/team/levels", { schema: levelsResponseSchema, signal }),
  createLevel: (name: string) => api.post<Level>("/team/levels", { name }, { schema: levelSchema }),
  updateLevel: (id: string, name: string) => api.patch<Level>(`/team/levels/${id}`, { name }, { schema: levelSchema }),
  removeLevel: (id: string) => api.delete<void>(`/team/levels/${id}`),

  order: (branchId: string, signal?: AbortSignal) => api.get<BranchOrder>("/team/order", { query: { branchId }, schema: branchOrderSchema, signal }),
  saveOrder: (order: BranchOrder) => api.put<BranchOrder>("/team/order", order, { schema: branchOrderSchema }),

  week: (branchId: string, weekStart: string, signal?: AbortSignal) =>
    api.get<WeekResponse>("/team/schedule", { query: { branchId, week: weekStart }, schema: weekResponseSchema, signal }),
  setOverride: (memberId: string, date: string, range: WorkingRange | null) =>
    api.put("/team/schedule/override", { memberId, date, range }, { schema: scheduleOverrideSchema }),
  clearOverride: (memberId: string, date: string) => api.delete<void>("/team/schedule/override", { query: { memberId, date } }),
};
