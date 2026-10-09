import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "./BookingContext";
import { MAX_REFERENCE_PHOTOS, prepareReferencePhoto } from "./referencePhoto";

/**
 * «Agregar foto del corte que quieres»: hasta tres imágenes de referencia que le llegan al
 * barbero con la cita (las ve en el calendario). Se eligen de la galería o con la cámara y
 * cada una se puede quitar.
 */
export function ReferencePhotoField() {
  const t = useAppT();
  const { state, dispatch } = useBookingFlow();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const photos = state.referencePhotos;
  const room = MAX_REFERENCE_PHOTOS - photos.length;

  const pick = async (files: FileList | null) => {
    const chosen = Array.from(files ?? []).slice(0, room);
    if (chosen.length === 0) return;
    setError(null);
    setIsPreparing(true);
    try {
      for (const file of chosen) dispatch({ type: "addReferencePhoto", photo: await prepareReferencePhoto(file) });
    } catch {
      setError(t("booking.photo.error"));
    } finally {
      setIsPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void pick(event.target.files)} aria-label={t("booking.photo.add")} />
      {photos.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3">
          <div className="flex flex-col">
            <Text size="sm" weight="medium">
              {t("booking.photo.added")}
            </Text>
            <Text size="xs" tone="muted">
              {t("booking.photo.addedHint")}
            </Text>
          </div>
          <ul className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <li key={index} className="relative">
                <img src={photo} alt={t("booking.photo.alt")} className="size-16 rounded-xl object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="absolute -right-1.5 -top-1.5 rounded-full shadow-sm"
                  onClick={() => dispatch({ type: "removeReferencePhoto", index })}
                  aria-label={t("booking.photo.remove")}
                >
                  <ThemaIcon name="close" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {room > 0 && (
        <Button type="button" variant="outline" className="self-start" disabled={isPreparing} onClick={() => inputRef.current?.click()}>
          <ThemaIcon name="camera" />
          {isPreparing ? t("booking.photo.preparing") : photos.length > 0 ? t("booking.photo.addMore", { count: room }) : t("booking.photo.add")}
        </Button>
      )}
      {error && (
        <Text size="xs" tone="negative">
          {error}
        </Text>
      )}
    </div>
  );
}
