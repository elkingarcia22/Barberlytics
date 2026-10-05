import * as React from "react";
import { Camera, Trash2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { ImageCropDialog } from "@/components/upload";
import { IconTile } from "@/components/utility";
import { Button } from "@/components/ui/button";

/**
 * La foto de una ficha del catálogo —un servicio, un producto—: la miniatura
 * como se verá en la lista, el botón para subirla (con recorte cuadrado) y el
 * de quitarla. Sin foto se ve el icono de la ficha, igual que en la lista.
 */

export interface CatalogPhotoFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  /** El icono de respaldo de la ficha (las tijeras, la caja). */
  icon: React.ReactNode;
  error?: string;
  testId?: string;
}

/** Cabe holgada en 1 MB y se ve nítida en la ficha a 64 px. */
const PHOTO_OUTPUT = { maxSize: 640, maxBytes: 700_000, type: "image/jpeg" } as const;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function CatalogPhotoField({ value, onChange, icon, error, testId }: CatalogPhotoFieldProps) {
  const t = useAppT();
  const [cropSource, setCropSource] = React.useState<string | null>(null);
  const [readError, setReadError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setReadError(t("catalog.photo.notImage"));
      return;
    }
    try {
      setReadError(null);
      setCropSource(await readAsDataUrl(file));
    } catch {
      setReadError(t("catalog.photo.notImage"));
    }
  };

  return (
    <Field label={t("catalog.photo.label")} description={t("catalog.photo.hint")} error={readError ?? error}>
      <div className="flex items-center gap-4" data-testid={testId}>
        <IconTile icon={icon} tone="neutral" size="xl" src={value} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera /> {t(value ? "catalog.photo.change" : "catalog.photo.upload")}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 /> {t("catalog.photo.remove")}
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void pick(event)} aria-label={t("catalog.photo.label")} />
        </div>
      </div>
      {cropSource && (
        <ImageCropDialog
          open
          onOpenChange={(open) => !open && setCropSource(null)}
          image={cropSource}
          aspect={1}
          title={t("catalog.photo.label")}
          onApply={(result) => {
            onChange(result.dataUrl);
            setCropSource(null);
          }}
          output={PHOTO_OUTPUT}
        />
      )}
    </Field>
  );
}
