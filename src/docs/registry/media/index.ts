import type { DocEntry } from "../types";
import { ubitsCarouselEntry } from "./ubits-carousel";
import { imageGridEntry } from "./image-grid";
import { galleryEntry } from "./gallery";
import { previewCardEntry } from "./preview-card";
import { mediaPreviewEntry } from "./media-preview";
import { emptyGalleryStateEntry } from "./empty-gallery-state";

/** Entradas del grupo "media". Cada componente vive en su propio archivo de esta carpeta. */
export const mediaEntries: readonly DocEntry[] = [
  ubitsCarouselEntry,
  imageGridEntry,
  galleryEntry,
  previewCardEntry,
  mediaPreviewEntry,
  emptyGalleryStateEntry,
];
