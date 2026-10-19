import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, describeError } from "@/lib/api";

/**
 * El cierre de caja: lo que debía haber en efectivo al final del día (según las cuentas) frente a
 * lo que se contó. Contrato en docs/API_CONTRACT.md («Caja»).
 */

export const registerExpectedSchema = z.object({
  /** `null` a ciegas: quien cuenta sin gestionar no ve el efectivo esperado hasta cerrar. */
  cash: z.number().nullable(),
  card: z.number(),
  link: z.number(),
  online: z.number(),
  refundsCash: z.number(),
  refundsCard: z.number(),
  accounts: z.number(),
  /** El efectivo que cobraron los barberos de renta: es de ellos y no entra al cajón. */
  renterCash: z.number().optional(),
  movementsIn: z.number().optional(),
  movementsOut: z.number().optional(),
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
  denominations: z.record(z.string(), z.number()).nullable().optional(),
  blind: z.boolean().optional(),
});
export type RegisterClosure = z.infer<typeof registerClosureSchema>;

export const cashMovementSchema = z.object({ id: z.string(), type: z.enum(["in", "out"]), amount: z.number(), reason: z.string(), at: z.string(), by: z.string() });
export type CashMovement = z.infer<typeof cashMovementSchema>;

export const registerDaySchema = z.object({
  branchId: z.string(),
  date: z.string(),
  blind: z.boolean().optional(),
  expected: registerExpectedSchema,
  closure: registerClosureSchema.nullable(),
  movements: z.array(cashMovementSchema).optional(),
});
export type RegisterDay = z.infer<typeof registerDaySchema>;

export interface RegisterCloseInput {
  branchId: string;
  date: string;
  opening: number;
  counted: number;
  note: string;
  /** Lo contado por denominación; el servidor vuelve a sumarlo. */
  denominations?: Record<string, number> | null;
}

export interface CashMovementInput {
  branchId: string;
  date: string;
  type: "in" | "out";
  amount: number;
  reason: string;
}

export const registerApi = {
  day: (branchId: string, date: string, signal?: AbortSignal) => api.get<RegisterDay>("/register", { query: { branchId, date }, schema: registerDaySchema, signal }),
  close: (input: RegisterCloseInput) => api.post<RegisterClosure>("/register/close", input, { schema: registerClosureSchema }),
  addMovement: (input: CashMovementInput) => api.post<CashMovement>("/register/movements", input, { schema: cashMovementSchema }),
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

export function useAddCashMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerApi.addMovement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["register"] }),
    onError: (error) => {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
  });
}

/** Lo que debería haber en efectivo: la base con la que abrió más lo que entró en el día. */
export const expectedInDrawer = (opening: number, expectedCash: number): number => Math.round((opening + expectedCash) * 100) / 100;
