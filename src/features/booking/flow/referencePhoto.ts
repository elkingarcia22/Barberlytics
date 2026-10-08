/**
 * La foto de referencia del corte, preparada en el celular antes de subirla: se reduce a 1024 px
 * por el lado largo y se guarda como JPEG, así pesa ~100–200 KB en vez de varios MB. Sin interfaz,
 * para probarla aparte.
 */
export const MAX_PHOTO_SIDE = 1024;
const JPEG_QUALITY = 0.82;
/** Lo que acepta el servidor: una imagen en data URL de hasta ~1,5 MB. */
export const MAX_PHOTO_CHARS = 1_500_000;
export const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

/** El tamaño reducido conservando la proporción. */
export function fitWithin(width: number, height: number, max = MAX_PHOTO_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function prepareReferencePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not_image");
  const bitmap = await createImageBitmap(file);
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no_canvas");
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  if (url.length > MAX_PHOTO_CHARS) throw new Error("too_big");
  return url;
}
