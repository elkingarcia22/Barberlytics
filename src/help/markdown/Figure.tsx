import * as React from "react";
import { ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAppT } from "@/app/i18n";
import { helpAssetUrl } from "../content";

interface FigureProps {
  src: string;
  alt: string;
}

/**
 * Una captura del artículo: marco, pie con el texto alternativo y ampliación
 * al tocar. La ruta viene del Markdown como `/assets/…` y se resuelve contra
 * la base publicada del centro de ayuda.
 */
export function Figure({ src, alt }: FigureProps) {
  const t = useAppT();
  const [open, setOpen] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const url = helpAssetUrl(src);
  // Una captura con receta pero sin tomar todavía no existe en la base
  // publicada: se ve el hueco con su descripción, no una imagen rota.
  if (failed) {
    return (
      <figure className="help-figure" data-testid="help-figure-pending">
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center">
          <ImageOff className="size-6 text-text-muted" aria-hidden />
          <span className="text-sm font-medium text-text-secondary">{t("help.figurePending")}</span>
        </div>
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="help-figure">
      <button type="button" onClick={() => setOpen(true)} aria-label={`${t("help.figureOpen")}: ${alt}`}>
        <img src={url} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </button>
      {alt && <figcaption>{alt}</figcaption>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl p-2 sm:p-3">
          <DialogTitle className="sr-only">{alt || t("help.figureOpen")}</DialogTitle>
          <DialogDescription className="sr-only">{t("help.figureClose")}</DialogDescription>
          <img src={url} alt={alt} className="h-auto w-full rounded-md" />
        </DialogContent>
      </Dialog>
    </figure>
  );
}
