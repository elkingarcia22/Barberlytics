import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/** La puesta en marcha de la sucursal. Contrato en docs/API_CONTRACT.md («Puesta en marcha»). */

const stepIdSchema = z.enum(["company", "branch", "hours", "services", "team", "payments", "booking", "clients"]);
export type OnboardingStepId = z.infer<typeof stepIdSchema>;
const onboardingSchema = z.object({ steps: z.array(z.object({ id: stepIdSchema, done: z.boolean(), href: z.string() })), done: z.number(), total: z.number() });
export type Onboarding = z.infer<typeof onboardingSchema>;

export const STEP_KEYS: Readonly<Record<OnboardingStepId, { title: AppMessageKey; hint: AppMessageKey }>> = {
  company: { title: "onboarding.company", hint: "onboarding.companyHint" },
  branch: { title: "onboarding.branch", hint: "onboarding.branchHint" },
  hours: { title: "onboarding.hours", hint: "onboarding.hoursHint" },
  services: { title: "onboarding.services", hint: "onboarding.servicesHint" },
  team: { title: "onboarding.team", hint: "onboarding.teamHint" },
  payments: { title: "onboarding.payments", hint: "onboarding.paymentsHint" },
  booking: { title: "onboarding.booking", hint: "onboarding.bookingHint" },
  clients: { title: "onboarding.clients", hint: "onboarding.clientsHint" },
};

export function useOnboarding(branchId: string, enabled: boolean) {
  return useQuery({ queryKey: ["onboarding", branchId], queryFn: ({ signal }) => api.get("/onboarding", { query: { branchId }, schema: onboardingSchema, signal }), enabled });
}

const HIDDEN_KEY = "thema.onboarding.hidden.v1";

/** «Ocultar por ahora» es una preferencia del navegador; si falla el almacenamiento, se vuelve a ver. */
export function readHidden(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeHidden(): void {
  try {
    window.localStorage.setItem(HIDDEN_KEY, "1");
  } catch {
    // Sin almacenamiento: se oculta hasta recargar.
  }
}
