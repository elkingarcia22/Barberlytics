import type { FeedbackUploadRequest } from "../../src/features/feedback/types.js";
import { GoogleApiError, type GoogleClient } from "./google.js";

const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

export interface UploadSessionOptions {
  /** La carpeta de la unidad compartida donde cae el archivo. */
  folderId: string;
  /** El origen del navegador que va a subir: Drive solo le acepta los bytes a él. */
  origin: string;
  receivedAt: Date;
}

/**
 * Abre una sesión de subida de Drive para un archivo concreto y devuelve su
 * URL. El navegador manda los bytes ahí directamente: no pasan por la función,
 * que no admite cuerpos del tamaño de un video.
 *
 * La sesión queda atada al tipo y al tamaño declarados, así que no sirve para
 * subir otra cosa, y la URL es su propia credencial: no lleva el token.
 */
export async function createUploadSession(client: GoogleClient, request: FeedbackUploadRequest, options: UploadSessionOptions): Promise<string> {
  const stamp = options.receivedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const response = await client.raw(`${UPLOAD}?uploadType=resumable&supportsAllDrives=true&fields=id`, {
    method: "POST",
    headers: {
      "X-Upload-Content-Type": request.mimeType,
      "X-Upload-Content-Length": String(request.size),
      Origin: options.origin,
    },
    body: {
      name: `${stamp} · ${request.name}`,
      parents: [options.folderId],
      appProperties: { themaFeedback: "1", themaCampaignId: request.campaignId },
    },
  });
  const location = response.headers.get("location");
  if (!location) throw new GoogleApiError(502, "Drive no devolvió la sesión de subida.");
  return location;
}

interface DriveAttachment {
  id: string;
  webViewLink?: string;
  parents?: string[];
}

/**
 * Los enlaces de los adjuntos de un comentario. Los ids los manda el
 * navegador, así que solo cuentan los que de verdad están en la carpeta de
 * feedback: cualquier otro —inventado o de otro sitio— se descarta.
 */
export async function resolveAttachmentLinks(client: GoogleClient, folderId: string, ids: readonly string[]): Promise<string[]> {
  const links: string[] = [];
  for (const id of ids) {
    try {
      const file = await client.json<DriveAttachment>(`${DRIVE}/files/${encodeURIComponent(id)}?fields=id,webViewLink,parents&supportsAllDrives=true`);
      if (file.parents?.includes(folderId) && file.webViewLink) links.push(file.webViewLink);
    } catch (error) {
      if (!(error instanceof GoogleApiError) || error.status !== 404) throw error;
    }
  }
  return links;
}
