import type { GoogleClient } from "./google";

/**
 * La hoja de cálculo de una campaña: una por campaña, con dos pestañas,
 * «Comentarios» (una fila por comentario) y «Resumen» (una por análisis).
 *
 * No hay base de datos que recuerde cuál es la hoja de cada campaña: la hoja
 * misma lleva el id de la campaña en sus propiedades de Drive
 * (`appProperties`), y se encuentra buscándola por ahí. Así el servidor no
 * guarda estado y cualquier instancia de la función llega a la misma hoja.
 */
export const COMMENTS_TAB = "Comentarios";
export const SUMMARY_TAB = "Resumen";

export const COMMENT_COLUMNS = [
  "fecha_recibido",
  "fecha_envio",
  "campana_id",
  "campana",
  "pagina",
  "ruta",
  "seccion",
  "comentario",
  "usuario",
  "correo",
  "rol",
] as const;

export const SUMMARY_COLUMNS = [
  "fecha_analisis",
  "campana_id",
  "campana",
  "total_comentarios",
  "desde",
  "hasta",
  "resumen",
  "sentimiento",
  "temas_principales",
  "prioridades",
  "quick_wins",
  "riesgos",
  "metricas_sugeridas",
  "modelo",
] as const;

export type CommentRow = Record<(typeof COMMENT_COLUMNS)[number], string>;
export type SummaryRow = Record<(typeof SUMMARY_COLUMNS)[number], string>;

const DRIVE = "https://www.googleapis.com/drive/v3";
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet";
const MARKER_KEY = "themaFeedback";
const CAMPAIGN_KEY = "themaCampaignId";

const COMMENTS_SHEET_ID = 0;
const SUMMARY_SHEET_ID = 1;

export interface CampaignSheet {
  id: string;
  url: string;
}

export interface EnsuredCampaignSheet extends CampaignSheet {
  created: boolean;
  /** A quién se le dio acceso al crearla (vacío si ya existía). */
  sharedWith: string[];
  /** Correos a los que no se pudo dar acceso, con el motivo. */
  shareErrors: string[];
}

interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
}

export const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

const quote = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const tabRange = (tab: string, columns: number) => `${tab}!A:${String.fromCharCode(64 + columns)}`;

/** Las hojas de una campaña, la más antigua primero: si por una carrera hay dos, gana la primera. */
async function findCampaignFiles(client: GoogleClient, campaignId: string): Promise<DriveFile[]> {
  const query = `appProperties has { key=${quote(MARKER_KEY)} and value='1' } and appProperties has { key=${quote(CAMPAIGN_KEY)} and value=${quote(campaignId)} } and trashed=false`;
  const params = new URLSearchParams({ q: query, fields: "files(id,name,createdTime)", orderBy: "createdTime", pageSize: "10" });
  const result = await client.json<{ files?: DriveFile[] }>(`${DRIVE}/files?${params}`);
  return result.files ?? [];
}

export async function findCampaignSheet(client: GoogleClient, campaignId: string): Promise<CampaignSheet | null> {
  const [first] = await findCampaignFiles(client, campaignId);
  return first ? { id: first.id, url: sheetUrl(first.id) } : null;
}

/** Pone las dos pestañas, sus cabeceras fijas y en negrita, y el texto del resumen ajustado al ancho. */
async function buildTabs(client: GoogleClient, spreadsheetId: string): Promise<void> {
  const header = { textFormat: { bold: true }, backgroundColor: { red: 0.93, green: 0.93, blue: 0.95 } };
  await client.json(`${SHEETS}/${spreadsheetId}:batchUpdate`, {
    body: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: COMMENTS_SHEET_ID, title: COMMENTS_TAB, gridProperties: { frozenRowCount: 1 } },
            fields: "title,gridProperties.frozenRowCount",
          },
        },
        { addSheet: { properties: { sheetId: SUMMARY_SHEET_ID, title: SUMMARY_TAB, gridProperties: { frozenRowCount: 1 } } } },
        ...[COMMENTS_SHEET_ID, SUMMARY_SHEET_ID].map((sheetId) => ({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: header },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        })),
        {
          repeatCell: {
            range: { sheetId: SUMMARY_SHEET_ID, startRowIndex: 1 },
            cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
            fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
          },
        },
      ],
    },
  });
  await client.json(`${SHEETS}/${spreadsheetId}/values:batchUpdate`, {
    body: {
      valueInputOption: "RAW",
      data: [
        { range: `${COMMENTS_TAB}!A1`, values: [[...COMMENT_COLUMNS]] },
        { range: `${SUMMARY_TAB}!A1`, values: [[...SUMMARY_COLUMNS]] },
      ],
    },
  });
}

async function shareSheet(client: GoogleClient, spreadsheetId: string, emails: readonly string[]) {
  const sharedWith: string[] = [];
  const shareErrors: string[] = [];
  for (const emailAddress of emails) {
    try {
      await client.json(`${DRIVE}/files/${spreadsheetId}/permissions?sendNotificationEmail=false`, {
        body: { type: "user", role: "writer", emailAddress },
      });
      sharedWith.push(emailAddress);
    } catch (error) {
      shareErrors.push(`${emailAddress}: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }
  return { sharedWith, shareErrors };
}

/**
 * La hoja de la campaña; si no existe, la crea y se la comparte a quien toque.
 * Idempotente: llamarla de nuevo devuelve la misma.
 *
 * Dos comentarios que lleguen a la vez antes de que exista la hoja pueden crear
 * dos. Se resuelve después de crear: si la nuestra no es la más antigua, se
 * borra y se usa la primera, así todas las instancias acaban en la misma.
 */
export async function ensureCampaignSheet(
  client: GoogleClient,
  campaign: { id: string; name: string },
  shareWith: readonly string[]
): Promise<EnsuredCampaignSheet> {
  const [existing] = await findCampaignFiles(client, campaign.id);
  if (existing) return { id: existing.id, url: sheetUrl(existing.id), created: false, sharedWith: [], shareErrors: [] };

  const file = await client.json<{ id: string }>(`${DRIVE}/files`, {
    body: {
      name: `Feedback · ${campaign.name}`,
      mimeType: SPREADSHEET_MIME,
      appProperties: { [MARKER_KEY]: "1", [CAMPAIGN_KEY]: campaign.id },
    },
  });

  const [oldest] = await findCampaignFiles(client, campaign.id);
  if (oldest && oldest.id !== file.id) {
    await client.json(`${DRIVE}/files/${file.id}`, { method: "DELETE" }).catch(() => undefined);
    return { id: oldest.id, url: sheetUrl(oldest.id), created: false, sharedWith: [], shareErrors: [] };
  }

  await buildTabs(client, file.id);
  const sharing = await shareSheet(client, file.id, shareWith);
  return { id: file.id, url: sheetUrl(file.id), created: true, ...sharing };
}

export async function appendComment(client: GoogleClient, spreadsheetId: string, row: CommentRow): Promise<void> {
  const params = new URLSearchParams({ valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" });
  // RAW: Sheets guarda el texto tal cual, así que un comentario que empiece por «=» no se evalúa como fórmula.
  await client.json(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(tabRange(COMMENTS_TAB, COMMENT_COLUMNS.length))}:append?${params}`, {
    body: { values: [COMMENT_COLUMNS.map((column) => row[column])] },
  });
}

export async function appendSummary(client: GoogleClient, spreadsheetId: string, row: SummaryRow): Promise<void> {
  const params = new URLSearchParams({ valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" });
  await client.json(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(tabRange(SUMMARY_TAB, SUMMARY_COLUMNS.length))}:append?${params}`, {
    body: { values: [SUMMARY_COLUMNS.map((column) => row[column])] },
  });
}

function toRecords<K extends string>(columns: readonly K[], rows: string[][]): Record<K, string>[] {
  return rows.map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""])) as Record<K, string>);
}

async function readTab(client: GoogleClient, spreadsheetId: string, tab: string, columns: number): Promise<string[][]> {
  const result = await client.json<{ values?: string[][] }>(`${SHEETS}/${spreadsheetId}/values/${encodeURIComponent(tabRange(tab, columns))}`);
  // La primera fila es la cabecera.
  return (result.values ?? []).slice(1);
}

export async function readComments(client: GoogleClient, spreadsheetId: string): Promise<CommentRow[]> {
  return toRecords(COMMENT_COLUMNS, await readTab(client, spreadsheetId, COMMENTS_TAB, COMMENT_COLUMNS.length));
}

export async function readSummaries(client: GoogleClient, spreadsheetId: string): Promise<SummaryRow[]> {
  return toRecords(SUMMARY_COLUMNS, await readTab(client, spreadsheetId, SUMMARY_TAB, SUMMARY_COLUMNS.length));
}
