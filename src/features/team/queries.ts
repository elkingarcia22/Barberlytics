import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarKeys } from "@/features/calendar/queries";
import { teamApi, type MemberImportRow } from "./api";
import type { BranchOrder, MemberDraft, MemberPatch, ShiftScope, TeamMember, WorkingRange } from "./types";

/**
 * Claves jerárquicas del equipo. Cualquier cambio en una persona refresca
 * también el catálogo del calendario: los barberos, sus horarios y su orden
 * salen de aquí.
 */
export const teamKeys = {
  all: ["team"] as const,
  members: (branchId: string, all: boolean) => [...teamKeys.all, "members", branchId, all] as const,
  member: (id: string) => [...teamKeys.all, "member", id] as const,
  levels: () => [...teamKeys.all, "levels"] as const,
  order: (branchId: string) => [...teamKeys.all, "order", branchId] as const,
  week: (branchId: string, weekStart: string) => [...teamKeys.all, "week", branchId, weekStart] as const,
};

function useInvalidateTeam() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: teamKeys.all });
    void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
  };
}

export function useMembersQuery(branchId: string, all = false) {
  return useQuery({
    queryKey: teamKeys.members(branchId, all),
    queryFn: ({ signal }) => teamApi.members(branchId, all, signal),
    placeholderData: keepPreviousData,
  });
}

export function useMemberQuery(id: string | null) {
  return useQuery({
    queryKey: teamKeys.member(id ?? ""),
    queryFn: ({ signal }) => teamApi.member(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useLevelsQuery() {
  return useQuery({ queryKey: teamKeys.levels(), queryFn: ({ signal }) => teamApi.levels(signal) });
}

export function useOrderQuery(branchId: string) {
  return useQuery({ queryKey: teamKeys.order(branchId), queryFn: ({ signal }) => teamApi.order(branchId, signal) });
}

export function useWeekQuery(branchId: string, weekStart: string) {
  return useQuery({
    queryKey: teamKeys.week(branchId, weekStart),
    queryFn: ({ signal }) => teamApi.week(branchId, weekStart, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCreateMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (draft: MemberDraft) => teamApi.createMember(draft), onSuccess: invalidate });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: MemberPatch }) => teamApi.updateMember(id, patch),
    onSuccess: (member: TeamMember) => {
      queryClient.setQueryData(teamKeys.member(member.id), member);
      invalidate();
    },
  });
}

export function useRemoveMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (id: string) => teamApi.removeMember(id), onSuccess: invalidate });
}

export function useSetActivation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ branchId, memberIds }: { branchId: string; memberIds: string[] }) => teamApi.setActivation(branchId, memberIds), onSuccess: invalidate });
}

export function useCreateLevel() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (name: string) => teamApi.createLevel(name), onSuccess: invalidate });
}

export function useUpdateLevel() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => teamApi.updateLevel(id, name), onSuccess: invalidate });
}

export function useRemoveLevel() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (id: string) => teamApi.removeLevel(id), onSuccess: invalidate });
}

export function useSaveOrder() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (order: BranchOrder) => teamApi.saveOrder(order), onSuccess: invalidate });
}

export function useSetOverride() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({ memberId, date, range }: { memberId: string; date: string; range: WorkingRange | null }) => teamApi.setOverride(memberId, date, range),
    onSuccess: invalidate,
  });
}

export function useClearOverride() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ memberId, date }: { memberId: string; date: string }) => teamApi.clearOverride(memberId, date), onSuccess: invalidate });
}

/** «Este y los siguientes»: cambia el horario fijo de ese día de la semana desde la fecha dada. */
export function useSetWeekday() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({ memberId, from, range }: { memberId: string; from: string; range: WorkingRange | null }) => teamApi.setWeekday(memberId, from, range),
    onSuccess: invalidate,
  });
}

/** Las citas que quedarían fuera del turno que se está armando (se pide de nuevo al cambiarlo). */
export function useScheduleImpact(input: { memberId: string; date: string; range: WorkingRange | null; scope: ShiftScope } | null) {
  return useQuery({
    queryKey: [...teamKeys.all, "impact", input] as const,
    queryFn: ({ signal }) => teamApi.impact(input!, signal),
    enabled: input !== null,
    placeholderData: keepPreviousData,
  });
}

export function useCopyWeek() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ branchId, from, to }: { branchId: string; from: string; to: string }) => teamApi.copyWeek(branchId, from, to), onSuccess: invalidate });
}

export function useRemindMembers() {
  return useMutation({ mutationFn: (ids: readonly string[]) => teamApi.remind(ids) });
}

export function useDeactivateMembers() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (ids: readonly string[]) => teamApi.deactivate(ids), onSuccess: invalidate });
}

export function useImportMembers() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ branchId, items }: { branchId: string; items: readonly MemberImportRow[] }) => teamApi.importMembers(branchId, items), onSuccess: invalidate });
}

export function useRevealBank() {
  return useMutation({ mutationFn: (id: string) => teamApi.bank(id) });
}
