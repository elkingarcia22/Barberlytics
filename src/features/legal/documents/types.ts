/**
 * Los documentos legales de Barberlytics, como datos: cada uno con su versión (la que se guarda cuando
 * alguien lo acepta), su fecha y sus secciones en español y, si existe, en inglés.
 *
 * Son **borradores de producto**: los redactó el equipo a partir de la investigación
 * (docs/investigacion-modulos/17-paso-a-produccion-y-legal.md) y no son asesoría legal. Un abogado de
 * cada país los revisa antes de publicarse; lo que falta decidir va entre corchetes («[por completar]»).
 */

export type LegalDocId = "terms" | "privacy" | "dataPolicy" | "dpa" | "subprocessors";
export type LegalLocale = "es" | "en";

export interface LegalSection {
  id: string;
  title: Record<LegalLocale, string>;
  /** Párrafos; una línea que empieza con «- » se pinta como viñeta. */
  body: Record<LegalLocale, readonly string[]>;
}

export interface LegalDoc {
  id: LegalDocId;
  /** La ruta pública: `/legal/<slug>`. */
  slug: string;
  version: string;
  /** AAAA-MM-DD de esta versión. */
  updatedAt: string;
  title: Record<LegalLocale, string>;
  summary: Record<LegalLocale, string>;
  /** Para quién es (quién lo acepta o a quién protege). */
  audience: Record<LegalLocale, string>;
  /** Si solo hay texto en español (la política de Colombia), el inglés muestra el resumen y el aviso. */
  spanishOnly?: boolean;
  sections: readonly LegalSection[];
}

/** Quién es Barberlytics en estos textos: lo que falta lo pone el abogado y la empresa. */
export const LEGAL_ENTITY = {
  name: "Barberlytics",
  legalName: "[razón social por completar]",
  address: "[dirección por completar]",
  privacyContact: "[correo de privacidad por completar]",
  securityContact: "[correo de seguridad por completar]",
} as const;

/** Texto común: el aviso de borrador que llevan todos. */
export const DRAFT_NOTICE: Record<LegalLocale, string> = {
  es: "Borrador de producto. No es asesoría legal: un abogado de cada país lo revisa y aprueba antes de publicarlo. Lo que está entre corchetes falta completarlo.",
  en: "Product draft. Not legal advice: a lawyer in each country reviews and approves it before publication. Anything in brackets is still to be completed.",
};

/** Las dos versiones de un párrafo a la vez, para escribir los documentos sin repetir la estructura. */
export const both = (es: readonly string[], en: readonly string[]): Record<LegalLocale, readonly string[]> => ({ es, en });
export const titled = (es: string, en: string): Record<LegalLocale, string> => ({ es, en });
