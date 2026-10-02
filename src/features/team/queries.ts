import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarKeys } from "@/features/calendar/queries";
import { teamApi } from "./api";
import type { BranchOrder, MemberDraft, MemberPatch, TeamMember, WorkingRange } from "./types";

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
