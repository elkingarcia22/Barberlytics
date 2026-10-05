import { z } from "zod";
import type { AppMessageKey } from "@/app/i18n/types";

export const serviceKindSchema = z.enum(["service", "combo"]);
export type ServiceKind = z.infer<typeof serviceKindSchema>;

export const visibilitySchema = z.enum(["public", "private"]);
export type Visibility = z.infer<typeof visibilitySchema>;

export const prepPositionSchema = z.enum(["start", "end"]);
export type PrepPosition = z.infer<typeof prepPositionSchema>;

export const serviceCategorySchema = z.object({ id: z.string(), name: z.string(), description: z.string(), visibility: visibilitySchema });
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;

export const catalogServiceSchema = z.object({
  id: z.string(),
  kind: serviceKindSchema,
  name: z.string(),
  description: z.string(),
  categoryId: z.string(),
  price: z.number(),
  cost: z.number().nullable(),
  durationMin: z.number(),
  taxRate: z.number().nullable(),
  visibility: visibilitySchema,
  /** Si se ofrece en la sucursal activa. */
  active: z.boolean(),
  multiservice: z.boolean(),
  prep: z.object({ enabled: z.boolean(), minutes: z.number(), position: prepPositionSchema }),
  giftCards: z.boolean(),
  includes: z.array(z.string()),
  /** La foto del servicio; sin ella se pinta el icono. */
  imageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  /** Cuántos barberos de la sucursal lo ofrecen, y de cuántos. */
  offeredBy: z.number(),
  teamSize: z.number(),
});
export type CatalogService = z.infer<typeof catalogServiceSchema>;

export const servicesCatalogSchema = z.object({ categories: z.array(serviceCategorySchema), items: z.array(catalogServiceSchema) });
export type ServicesCatalog = z.infer<typeof servicesCatalogSchema>;

export const serviceTeamRowSchema = z.object({
  memberId: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  offered: z.boolean(),
  /** Precio y duración con los que lo hace esta persona: los suyos o los del catálogo. */
  price: z.number(),
  durationMin: z.number(),
  custom: z.boolean(),
});
export type ServiceTeamRow = z.infer<typeof serviceTeamRowSchema>;

export const serviceDetailSchema = catalogServiceSchema.extend({ team: z.array(serviceTeamRowSchema) });
export type ServiceDetail = z.infer<typeof serviceDetailSchema>;

/** La categoría a la que caen los servicios cuando se borra la suya. */
export const UNCATEGORIZED_ID = "cat_none";

export const MIN_DURATION_MIN = 5;
export const MAX_DURATION_MIN = 480;
export const MAX_PREP_MIN = 60;
export const MIN_COMBO_SERVICES = 2;

/** Lo que captura el formulario de servicio y de combo. Los mensajes son claves del diccionario. */
export const serviceInputSchema = z
  .object({
    kind: serviceKindSchema,
    name: z.string().trim().min(2, "services.form.error.name"),
    description: z.string().trim(),
    categoryId: z.string().min(1, "services.form.error.category"),
    price: z.number({ error: "services.form.error.price" }).min(0, "services.form.error.price"),
    cost: z.number().min(0, "services.form.error.cost").nullable(),
    durationMin: z.number({ error: "services.form.error.duration" }).min(MIN_DURATION_MIN, "services.form.error.duration").max(MAX_DURATION_MIN, "services.form.error.duration"),
    taxRate: z.number().min(0, "services.form.error.tax").max(100, "services.form.error.tax").nullable(),
    visibility: visibilitySchema,
    multiservice: z.boolean(),
    prep: z.object({ enabled: z.boolean(), minutes: z.number(), position: prepPositionSchema }),
    giftCards: z.boolean(),
    includes: z.array(z.string()),
    /** Enlace o imagen subida (data URL); `null` = sin foto. */
    imageUrl: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "combo" && value.includes.length < MIN_COMBO_SERVICES) ctx.addIssue({ code: "custom", path: ["includes"], message: "services.form.error.includes" });
    if (value.prep.enabled && (value.prep.minutes < 1 || value.prep.minutes > MAX_PREP_MIN)) ctx.addIssue({ code: "custom", path: ["prep"], message: "services.form.error.prep" });
  });
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export function emptyServiceInput(kind: ServiceKind, categoryId: string): ServiceInput {
  return { kind, name: "", description: "", categoryId, price: Number.NaN, cost: null, durationMin: kind === "combo" ? 60 : 30, taxRate: null, visibility: "public", multiservice: false, prep: { enabled: false, minutes: 5, position: "start" }, giftCards: true, includes: [], imageUrl: null };
}

export function inputFromService(service: CatalogService): ServiceInput {
  return { kind: service.kind, name: service.name, description: service.description, categoryId: service.categoryId, price: service.price, cost: service.cost, durationMin: service.durationMin, taxRate: service.taxRate, visibility: service.visibility, multiservice: service.multiservice, prep: { ...service.prep, minutes: service.prep.enabled ? service.prep.minutes : 5 }, giftCards: service.giftCards, includes: service.includes, imageUrl: service.imageUrl ?? null };
}

export const categoryInputSchema = z.object({ name: z.string().trim().min(2, "services.category.error.name"), description: z.string().trim(), visibility: visibilitySchema });
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export interface ServiceOrderInput {
  categoryIds: string[];
  serviceIds: string[];
}

export const KIND_KEYS: Readonly<Record<ServiceKind, AppMessageKey>> = { service: "services.kind.service", combo: "services.kind.combo" };
export const VISIBILITY_KEYS: Readonly<Record<Visibility, AppMessageKey>> = { public: "services.visibility.public", private: "services.visibility.private" };
