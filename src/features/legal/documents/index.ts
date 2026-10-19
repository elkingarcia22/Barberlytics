import { DATA_POLICY } from "./dataPolicy";
import { DPA } from "./dpa";
import { PRIVACY } from "./privacy";
import { SUBPROCESSORS } from "./subprocessors";
import { TERMS } from "./terms";
import type { LegalDoc, LegalDocId } from "./types";

export { DRAFT_NOTICE, LEGAL_ENTITY, type LegalDoc, type LegalDocId, type LegalLocale, type LegalSection } from "./types";

/** Los documentos en el orden en que se listan. */
export const LEGAL_DOCS: readonly LegalDoc[] = [TERMS, PRIVACY, DATA_POLICY, DPA, SUBPROCESSORS];

export const legalDocBySlug = (slug: string | undefined): LegalDoc | undefined => LEGAL_DOCS.find((doc) => doc.slug === slug);
export const legalDoc = (id: LegalDocId): LegalDoc => LEGAL_DOCS.find((doc) => doc.id === id) as LegalDoc;
/** `/legal/terminos`… */
export const legalHref = (id: LegalDocId): string => `/legal/${legalDoc(id).slug}`;
/** Las versiones vigentes: las que se guardan al aceptar. */
export const legalVersion = (id: LegalDocId): string => legalDoc(id).version;
