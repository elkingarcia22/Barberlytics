import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/** Margen por hora de silla y matriz del catálogo. Contrato en docs/API_CONTRACT.md («Reportes»). */

export const quadrantSchema = z.enum(["star", "plowhorse", "puzzle", "dog"]);
export type Quadrant = z.infer<typeof quadrantSchema>;

const menuSchema = z.object({
  days: z.number(),
  avgMarginPerHour: z.number(),
  chairHours: z.number(),
  margin: z.number(),
  units: z.number(),
  costCoverage: z.object({ withCost: z.number(), total: z.number() }),
  items: z.array(
    z.object({
      serviceId: z.string(),
      name: z.string(),
      units: z.number(),
      avgPrice: z.number(),
      unitCost: z.number(),
      unitCommission: z.number(),
      unitMargin: z.number(),
      minutesPerUnit: z.number(),
      hours: z.number(),
      marginPerHour: z.number(),
      hasCost: z.boolean(),
      popularity: z.number(),
      quadrant: quadrantSchema,
      targetPrice: z.number().nullable(),
    })
  ),
});
export type MenuEngineering = z.infer<typeof menuSchema>;
export type MenuItem = MenuEngineering["items"][number];

export const QUADRANTS: readonly Quadrant[] = ["star", "plowhorse", "puzzle", "dog"];
export const QUADRANT_KEYS: Readonly<Record<Quadrant, { label: AppMessageKey; hint: AppMessageKey; action: AppMessageKey }>> = {
  star: { label: "services.menu.star", hint: "services.menu.starHint", action: "services.menu.starAction" },
  plowhorse: { label: "services.menu.plowhorse", hint: "services.menu.plowhorseHint", action: "services.menu.plowhorseAction" },
  puzzle: { label: "services.menu.puzzle", hint: "services.menu.puzzleHint", action: "services.menu.puzzleAction" },
  dog: { label: "services.menu.dog", hint: "services.menu.dogHint", action: "services.menu.dogAction" },
};

export function useMenuEngineering(branchId: string, days: number) {
  return useQuery({ queryKey: ["reports", "menu", branchId, days], queryFn: ({ signal }) => api.get("/reports/menu", { query: { branchId, days }, schema: menuSchema, signal }) });
}
