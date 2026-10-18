import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, describeError } from "@/lib/api";

/**
 * El cierre de caja: lo que debía haber en efectivo al final del día (según las cuentas) frente a
 * lo que se contó. Contrato en docs/API_CONTRACT.md («Caja»).
 */

export const registerExpectedSchema = z.object({
  cash: z.number(),
  card: z.number(),
  link: z.number(),
  online: z.number(),
  refundsCash: z.number(),
  refundsCard: z.number(),
  accounts: z.number(),
  /** El efectivo que cobraron los barberos de renta: es de ellos y no entra al cajón. */
  renterCash: z.number().optional(),
});
export type RegisterExpected = z.infer<typeof registerExpectedSchema>;

export const registerClosureSchema = z.object({
  id: z.string(),
  date: z.string(),
  opening: z.number(),
  expectedCash: z.number(),
  counted: z.number(),
  difference: z.number(),
  note: z.string(),
  closedAt: z.string(),
  closedBy: z.string(),
});
export type RegisterClosure = z.infer<typeof registerClosureSchema>;

export const registerDaySchema = z.object({ branchId: z.string(), date: z.string(), expected: registerExpectedSchema, closure: registerClosureSchema.nullable() });
export type RegisterDay = z.infer<typeof registerDaySchema>;

export interface RegisterCloseInput {
  branchId: string;
  date: string;
  opening: number;
  counted: number;
  note: string;
}

export const registerApi = {
  day: (branchId: string, date: string, signal?: AbortSignal) => api.get<RegisterDay>("/register", { query: { branchId, date }, schema: registerDaySchema, signal }),
  close: (input: RegisterCloseInput) => api.post<RegisterClosure>("/register/close", input, { schema: registerClosureSchema }),
};

const registerKeys = { day: (branchId: string, date: string) => ["register", branchId, date] as const };

export function useRegisterDay(branchId: string, date: string, enabled: boolean) {
  return useQuery({ queryKey: registerKeys.day(branchId, date), queryFn: ({ signal }) => registerApi.day(branchId, date, signal), enabled });
}

export function useCloseRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerApi.close,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["register"] }),
    onError: (error) => {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
  });
}

/** Lo que debería haber en efectivo: la base con la que abrió más lo que entró en el día. */
export const expectedInDrawer = (opening: number, expectedCash: number): number => Math.round((opening + expectedCash) * 100) / 100;
