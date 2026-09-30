import * as React from "react";
import { ImageCropDialog } from "@/components/upload";
import { BrandMenuPreview } from "./BrandMenuPreview";
import { readLogoFile } from "./logoFile";
import { LOGO_MAX_MB } from "./types";

const LOGO_OUTPUT = { maxSize: 512, maxBytes: LOGO_MAX_MB * 1024 * 1024, type: "image/png" } as const;

interface Source {
  dataUrl: string;
  isVector: boolean;
  height: number;
}

export interface AppliedLogo {
  dataUrl: string;
  height: number;
  isVector: boolean;
}

export interface UseLogoEditorOptions {
  /** Nombre de la barbería para la vista previa del menú. */
  name: string;
  onApply: (logo: AppliedLogo) => void;
  title?: string;
}

export interface LogoEditor {
  /** Lee el archivo elegido y abre el recortador. Rechaza si no es una imagen válida. */
  edit: (file: File) => Promise<void>;
  /** Vuelve a recortar un logo ya guardado. */
  editExisting: (dataUrl: string) => void;
  /** La ventana; se monta donde no la desmonte un menú que se cierra. */
  dialog: React.ReactNode;
}

/**
 * Elegir un logo pasa siempre por el recortador: cuadrado, con zoom y giro, y
 * la vista previa del menú real en claro y oscuro. Un SVG puede usarse sin
 * recortar para no perder la nitidez del vector.
 */
export function useLogoEditor({ name, onApply, title = "Ajusta tu isologo" }: UseLogoEditorOptions): LogoEditor {
  const [source, setSource] = React.useState<Source | null>(null);
  const [open, setOpen] = React.useState(false);

  const edit = React.useCallback(async (file: File) => {
    const read = await readLogoFile(file);
    setSource({ dataUrl: read.dataUrl, isVector: read.isVector, height: read.height });
    setOpen(true);
  }, []);

  const editExisting = React.useCallback((dataUrl: string) => {
    const probe = new Image();
    probe.onload = () => {
      setSource({ dataUrl, isVector: dataUrl.startsWith("data:image/svg"), height: probe.naturalHeight });
      setOpen(true);
    };
    probe.src = dataUrl;
  }, []);

  const dialog = source ? (
    <ImageCropDialog
      open={open}
      onOpenChange={setOpen}
      image={source.dataUrl}
      aspect={1}
      title={title}
      description="Deja el símbolo centrado y con poco aire alrededor: en el menú mide 32 px."
      applyLabel="Usar este recorte"
      output={LOGO_OUTPUT}
      onApply={(result) => onApply({ dataUrl: result.dataUrl, height: result.height, isVector: false })}
      onSkip={source.isVector ? () => onApply({ dataUrl: source.dataUrl, height: source.height, isVector: true }) : undefined}
      skipLabel="Usar el SVG sin recortar"
      renderPreview={(src) => (
        <div className="space-y-4">
          <BrandMenuPreview mode="light" logo={src ? { src } : null} name={name} />
          <BrandMenuPreview mode="dark" logo={src ? { src } : null} name={name} />
        </div>
      )}
    />
  ) : null;

  return { edit, editExisting, dialog };
}
