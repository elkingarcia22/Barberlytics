import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "./BookingContext";
import { prepareReferencePhoto } from "./referencePhoto";

/**
 * «Agregar foto del corte que quieres»: una imagen de referencia que le llega al barbero con la
 * cita (la ve en el calendario). Se elige de la galería o con la cámara y se puede quitar.
 */
export function ReferencePhotoField() {
  const t = useAppT();
  const { state, dispatch } = useBookingFlow();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsPreparing(true);
    try {
      dispatch({ type: "setReferencePhoto", photo: await prepareReferencePhoto(file) });
    } catch {
      setError(t("booking.photo.error"));
    } finally {
      setIsPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void pick(event.target.files?.[0])} aria-label={t("booking.photo.add")} />
      {state.referencePhoto ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
          <img src={state.referencePhoto} alt={t("booking.photo.alt")} className="size-16 shrink-0 rounded-xl object-cover" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Text size="sm" weight="medium">
              {t("booking.photo.added")}
            </Text>
            <Text size="xs" tone="muted">
              {t("booking.photo.addedHint")}
            </Text>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => dispatch({ type: "setReferencePhoto", photo: null })} aria-label={t("booking.photo.remove")}>
            <ThemaIcon name="close" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="self-start" disabled={isPreparing} onClick={() => inputRef.current?.click()}>
          <ThemaIcon name="camera" />
          {isPreparing ? t("booking.photo.preparing") : t("booking.photo.add")}
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
