/** Alto mínimo de un PNG/JPG/WebP para que se vea nítido a 32px en pantallas retina. */
export const MIN_RASTER_HEIGHT = 64;

export interface LogoFile {
  dataUrl: string;
  width: number;
  height: number;
  isVector: boolean;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function measure(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("El archivo no es una imagen válida."));
    image.src = src;
  });
}

/** Lee el archivo que subió la empresa y mide su proporción real. */
export async function readLogoFile(file: File): Promise<LogoFile> {
  const dataUrl = await readAsDataUrl(file);
  const { width, height } = await measure(dataUrl);
  return { dataUrl, width, height, isVector: file.type === "image/svg+xml" };
}

/** Aviso de calidad, o `null` si el logo se verá bien. */
export function logoQualityWarning(logo: Pick<LogoFile, "height" | "isVector">): string | null {
  if (logo.isVector || logo.height >= MIN_RASTER_HEIGHT) return null;
  return `Mide ${logo.height} px de alto: se verá borroso. Sube uno de al menos ${MIN_RASTER_HEIGHT} px o, mejor, un SVG.`;
}
