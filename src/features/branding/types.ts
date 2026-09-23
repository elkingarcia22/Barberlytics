import { z } from "zod";

/** Identidad de la empresa; ver docs/API_CONTRACT.md → `/company/branding`. */
export const brandingSchema = z.object({
  name: z.string().nullable(),
  logo: z.string().nullable(),
  logoDark: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
export type Branding = z.infer<typeof brandingSchema>;

export type BrandingInput = Pick<Branding, "name" | "logo" | "logoDark">;

/** Formatos que acepta el backend. */
export const LOGO_ACCEPT = "image/png,image/svg+xml,image/jpeg,image/webp";
export const LOGO_MAX_MB = 1;
export const BRAND_NAME_MAX = 60;
