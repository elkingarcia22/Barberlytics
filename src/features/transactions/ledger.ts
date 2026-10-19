import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";
import { METHOD_KEYS, ONLINE_METHOD_KEYS, REFUND_TO_KEYS } from "./types";

/**
 * El libro de pagos: cada movimiento de dinero del periodo, en orden y sin borrar nada (ver
 * docs/API_CONTRACT.md, «Transacciones»). Una corrección es otro movimiento, no un cambio.
 */

export const ledgerKindSchema = z.enum(["charge", "online", "tip", "refund", "sale"]);
export type LedgerKind = z.infer<typeof ledgerKindSchema>;

const ledgerSchema = z.object({
  from: z.string(),
  to: z.string(),
  entries: z.array(z.object({ id: z.string(), at: z.string(), kind: ledgerKindSchema, method: z.string(), amount: z.number(), by: z.string(), concept: z.string(), appointmentId: z.string().nullable(), saleId: z.string().nullable() })),
  totals: z.object({ in: z.number(), out: z.number(), net: z.number(), byMethod: z.record(z.string(), z.number()), byKind: z.record(z.string(), z.number()) }),
});
export type Ledger = z.infer<typeof ledgerSchema>;
export type LedgerEntry = Ledger["entries"][number];

export function useLedgerQuery(branchId: string, from: string, to: string, enabled: boolean) {
  return useQuery({ queryKey: ["transactions", "ledger", branchId, from, to], queryFn: ({ signal }) => api.get("/payments", { query: { branchId, from, to }, schema: ledgerSchema, signal }), enabled });
}

export const LEDGER_KIND_KEYS = {
  charge: "transactions.ledger.kind.charge",
  online: "transactions.ledger.kind.online",
  tip: "transactions.ledger.kind.tip",
  refund: "transactions.ledger.kind.refund",
  sale: "transactions.ledger.kind.sale",
} as const satisfies Record<LedgerKind, AppMessageKey>;

/** El nombre del medio, sea de caja, de la pasarela en línea o el destino de una devolución. */
export function methodKey(method: string): AppMessageKey | null {
  return (METHOD_KEYS as Record<string, AppMessageKey>)[method] ?? ONLINE_METHOD_KEYS[method] ?? (REFUND_TO_KEYS as Record<string, AppMessageKey>)[method] ?? null;
}
