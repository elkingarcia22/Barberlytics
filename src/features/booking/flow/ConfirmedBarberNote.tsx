import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThemaIcon } from "@/icons";
import { useReservationDetailsMutation } from "../queries";
import { useBookingFlow } from "./BookingContext";
import { ReferencePhotoField } from "./ReferencePhotoField";

/**
 * Nota y foto para el barbero, ya con la cita confirmada: se escriben aquí y se
 * mandan a la reserva. Una vez guardadas se quedan como constancia.
 */
export function ConfirmedBarberNote({ reservationId }: { reservationId: string }) {
  const t = useAppT();
  const { state, dispatch } = useBookingFlow();
  const save = useReservationDetailsMutation(state.token);
  const [isSaved, setIsSaved] = React.useState(false);
  const hasContent = state.notes.trim() !== "" || state.referencePhotos.length > 0;

  if (isSaved) {
    return (
      <section className="flex items-center gap-2 rounded-2xl border border-border bg-surface-subtle p-4">
        <ThemaIcon name="check" size="sm" tone="positive" />
        <Text size="sm">{t("booking.confirmed.barberNoteSaved")}</Text>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-subtle p-4">
      <Text weight="semibold">{t("booking.confirmed.barberNoteTitle")}</Text>
      <Field label={t("booking.review.notes")}>
        <Textarea value={state.notes} onChange={(event) => dispatch({ type: "setNotes", notes: event.target.value })} placeholder={t("booking.review.notesPlaceholder")} rows={2} />
      </Field>
      <ReferencePhotoField />
      {save.isError && (
        <Text size="sm" tone="negative" role="alert">
          {t("booking.confirmed.barberNoteError")}
        </Text>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={!hasContent || save.isPending}
        onClick={() =>
          save.mutate(
            { reservationId, input: { notes: state.notes.trim() || undefined, referencePhotos: [...state.referencePhotos] } },
            { onSuccess: () => setIsSaved(true) }
          )
        }
      >
        {t("booking.confirmed.barberNoteSave")}
      </Button>
    </section>
  );
}
