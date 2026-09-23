import { api } from "@/lib/api";
import { brandingSchema, type Branding, type BrandingInput } from "./types";

/** Contrato de identidad de la empresa; ver docs/API_CONTRACT.md. */
export const brandingApi = {
  get: (signal?: AbortSignal) => api.get<Branding>("/company/branding", { schema: brandingSchema, signal }),
  save: (input: BrandingInput) => api.put<Branding>("/company/branding", input, { schema: brandingSchema }),
};
