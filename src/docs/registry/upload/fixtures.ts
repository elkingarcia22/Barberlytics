/**
 * Archivos de mentira para los ejemplos del grupo "upload". Se construyen con
 * la File API nativa, así los componentes reciben exactamente lo que verían
 * en producción sin depender de un backend ni de assets.
 */

const KB = 1024;

export function makeFile(name: string, sizeKB: number, type: string): File {
  return new File([new Uint8Array(sizeKB * KB)], name, { type });
}

export const SAMPLE_FILES = {
  pdf: () => makeFile("informe-trimestral.pdf", 1240, "application/pdf"),
  image: () => makeFile("portada-curso.png", 340, "image/png"),
  spreadsheet: () => makeFile("nomina-marzo.xlsx", 96, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  document: () => makeFile("acta-reunion.docx", 58, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  archive: () => makeFile("evidencias.zip", 4820, "application/zip"),
  video: () => makeFile("intro-onboarding.mp4", 18200, "video/mp4"),
} as const;

export type SampleFileKind = keyof typeof SAMPLE_FILES;

export const SAMPLE_FILE_KINDS = Object.keys(SAMPLE_FILES) as SampleFileKind[];

export function sampleFiles(kinds: SampleFileKind[] = ["pdf", "image", "spreadsheet"]): File[] {
  return kinds.map((kind) => SAMPLE_FILES[kind]());
}

/** Snippet equivalente para mostrar en el código de los ejemplos. */
export const MAKE_FILE_SNIPPET = `// Archivos de ejemplo (en producción vienen del <input type="file">)
const files = [
  new File([new Uint8Array(1240 * 1024)], "informe-trimestral.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(340 * 1024)], "portada-curso.png", { type: "image/png" }),
  new File([new Uint8Array(96 * 1024)], "nomina-marzo.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
];`;
