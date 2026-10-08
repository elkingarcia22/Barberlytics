import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import type { BackupEmail, BackupEmailRequest, BackupEmailVerify } from "./types";

/**
 * El correo de respaldo de quien tiene la sesión. Es suyo, no de la barbería:
 * cada persona decide a qué correo le llega el código si el SMS no aparece.
 */
export const backupEmailKeys = { all: ["auth", "backup-email"] as const };

export function useBackupEmailQuery() {
  return useQuery({ queryKey: backupEmailKeys.all, queryFn: ({ signal }) => authApi.backupEmail.get(signal) });
}

export function useBackupEmailMutations() {
  const queryClient = useQueryClient();
  const store = (value: BackupEmail) => queryClient.setQueryData(backupEmailKeys.all, value);
  return {
    request: useMutation({ mutationFn: (body: BackupEmailRequest) => authApi.backupEmail.request(body) }),
    verify: useMutation({ mutationFn: (body: BackupEmailVerify) => authApi.backupEmail.verify(body), onSuccess: store }),
    remove: useMutation({ mutationFn: () => authApi.backupEmail.remove(), onSuccess: () => store({ email: null }) }),
  };
}
