import type { DocEntry } from "../types";
import { fileUploadEntry } from "./file-upload";
import { uploadZoneEntry } from "./upload-zone";
import { filePreviewEntry } from "./file-preview";
import { attachmentListEntry } from "./attachment-list";
import { uploadProgressEntry } from "./upload-progress";
import { importCsvPanelEntry } from "./import-csv-panel";
import { imageCropperEntry } from "./image-cropper";

/** Entradas del grupo "upload". Cada componente vive en su propio archivo de esta carpeta. */
export const uploadEntries: readonly DocEntry[] = [
  fileUploadEntry,
  uploadZoneEntry,
  filePreviewEntry,
  attachmentListEntry,
  uploadProgressEntry,
  importCsvPanelEntry,
  imageCropperEntry,
];
