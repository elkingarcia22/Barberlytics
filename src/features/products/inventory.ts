import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/**
 * El inventario ligero de una sucursal: existencias, mínimo, ritmo de venta y movimientos. Contrato en
 * docs/API_CONTRACT.md («Inventario»).
 */

export const stockStatusSchema = z.enum(["ok", "low", "out"]);
export type StockStatus = z.infer<typeof stockStatusSchema>;

export const stockItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  categoryId: z.string().nullable(),
  imageUrl: z.string().nullable(),
  onHand: z.number(),
  min: z.number(),
  status: stockStatusSchema,
  sold30: z.number(),
  daysLeft: z.number().nullable(),
  lastMovementAt: z.string().nullable(),
});
export type StockItem = z.infer<typeof stockItemSchema>;

const inventorySchema = z.object({ items: z.array(stockItemSchema), low: z.number() });
export type Inventory = z.infer<typeof inventorySchema>;

export const MANUAL_KINDS = ["receive", "count", "waste", "internal"] as const;
export type ManualKind = (typeof MANUAL_KINDS)[number];
const reasonSchema = z.enum(["sale", "online", "return", "receive", "count", "waste", "internal"]);
export type StockReason = z.infer<typeof reasonSchema>;

const movementSchema = z.object({ id: z.string(), delta: z.number(), onHand: z.number(), reason: reasonSchema, ref: z.string().nullable(), note: z.string(), at: z.string(), by: z.string() });
export type StockMovement = z.infer<typeof movementSchema>;

export const STOCK_STATUS_KEYS: Readonly<Record<StockStatus, AppMessageKey>> = { ok: "inventory.status.ok", low: "inventory.status.low", out: "inventory.status.out" };
export const STOCK_REASON_KEYS: Readonly<Record<StockReason, AppMessageKey>> = {
  sale: "inventory.reason.sale",
  online: "inventory.reason.online",
  return: "inventory.reason.return",
  receive: "inventory.reason.receive",
  count: "inventory.reason.count",
  waste: "inventory.reason.waste",
  internal: "inventory.reason.internal",
};

export const inventoryApi = {
  list: (branchId: string, signal?: AbortSignal) => api.get<Inventory>(`/inventory?branchId=${encodeURIComponent(branchId)}`, { schema: inventorySchema, signal }),
  move: (input: { branchId: string; productId: string; kind: ManualKind; qty: number; note?: string }) => api.post<StockItem>("/inventory/movements", input, { schema: stockItemSchema }),
  setMin: (branchId: string, productId: string, min: number) => api.patch<StockItem>(`/inventory/${productId}`, { branchId, min }, { schema: stockItemSchema }),
  movements: (branchId: string, productId: string, signal?: AbortSignal) => api.get<{ items: StockMovement[] }>(`/inventory/${productId}/movements?branchId=${encodeURIComponent(branchId)}`, { schema: z.object({ items: z.array(movementSchema) }), signal }),
};

const inventoryKey = (branchId: string) => ["inventory", branchId] as const;

export function useInventory(branchId: string) {
  return useQuery({ queryKey: inventoryKey(branchId), queryFn: ({ signal }) => inventoryApi.list(branchId, signal), enabled: branchId !== "" });
}

export function useStockMovements(branchId: string, productId: string | null) {
  return useQuery({ queryKey: [...inventoryKey(branchId), "movements", productId], queryFn: ({ signal }) => inventoryApi.movements(branchId, productId ?? "", signal), enabled: productId !== null });
}

/** Cualquier cambio vuelve a pedir la lista: el estado y el aviso de stock bajo dependen de todas las filas. */
function useRefresh(branchId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: inventoryKey(branchId) });
}

export function useMoveStock(branchId: string) {
  const refresh = useRefresh(branchId);
  return useMutation({ mutationFn: (input: { productId: string; kind: ManualKind; qty: number; note?: string }) => inventoryApi.move({ branchId, ...input }), onSuccess: refresh });
}

export function useSetStockMin(branchId: string) {
  const refresh = useRefresh(branchId);
  return useMutation({ mutationFn: ({ productId, min }: { productId: string; min: number }) => inventoryApi.setMin(branchId, productId, min), onSuccess: refresh });
}
