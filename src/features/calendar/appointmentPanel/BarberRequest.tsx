import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThemaIcon } from "@/icons";
import { MAX_REFERENCE_PHOTOS, prepareReferencePhoto } from "@/features/booking/flow/referencePhoto";
import type { Appointment, AppointmentPatch } from "../types";
import { ReferencePhotos } from "./PanelParts";
import { InlineList, PanelField } from "./bookingStyle";
import { SourceLine } from "./SourceLine";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * «Comentarios y foto del corte»: lo que llega con la cita para el barbero,
 * como una tarjeta más de la cita, debajo de «Día y hora». Cerrada se lee el
 * comentario y se ve la primera foto; abierta, el comentario entero y las
 * fotos. Si vino de la reserva en línea es lo que el cliente escribió y subió;
 * desde la agenda también se deja o se corrige (lo que dijo por teléfono, la
 * foto que mostró en el mostrador), con las reglas de la reserva: hasta tres
 * fotos, reducidas antes de guardarlas.
 */

export interface BarberRequestProps {
  model: AppointmentModel;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

export function BarberRequestField({ model, onPatch, open, onToggle }: BarberRequestProps & { open: boolean; onToggle: () => void }) {
  const t = useAppT();
  const { appointment } = model;
  const [editing, setEditing] = React.useState(false);
  const photos = appointment.referencePhotos ?? [];
  const hasContent = Boolean(appointment.notes) || photos.length > 0;
  const editable = model.unpaid;
  if (!hasContent && !editable) return null;
  const close = () => {
    setEditing(false);
    if (open) onToggle();
  };
  const value = appointment.notes ? `«${appointment.notes}»` : photos.length > 0 ? t("calendar.panel.request.onlyPhotos") : t("calendar.panel.request.empty");
  const detail = photos.length > 0 ? t("calendar.panel.request.photos", { count: photos.length }) : hasContent ? undefined : t("calendar.panel.request.addHint");
  return (
    <>
      <PanelField
        eyebrow={t("calendar.panel.fields.request")}
        value={value}
        detail={detail}
        imageUrl={photos[0]}
        icon="camera"
        open={open}
        onOpen={() => {
          // Vacía, abrirla es dejar el comentario o la foto.
          if (!hasContent) setEditing(true);
          onToggle();
        }}
        testId="panel-field-request"
      />
      {open && (editing || !hasContent) && <BarberRequestForm model={model} onPatch={onPatch} onDone={close} />}
      {open && !editing && hasContent && (
        <InlineList
          title={t("calendar.panel.request.view")}
          onClose={close}
          footer={
            editable ? (
              <Button variant="outline" className="flex-1" onClick={() => setEditing(true)} data-testid="panel-request-edit">
                <ThemaIcon name="edit" /> {t("calendar.panel.request.editShort")}
              </Button>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-3" data-testid="panel-request">
            <SourceLine appointment={appointment} />
            {appointment.notes && <Text className="border-l-2 border-primary/60 pl-3 italic">«{appointment.notes}»</Text>}
            <ReferencePhotos model={model} />
          </div>
        </InlineList>
      )}
    </>
  );
}

function BarberRequestForm({ model, onPatch, onDone }: BarberRequestProps & { onDone: () => void }) {
  const t = useAppT();
  const { appointment } = model;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [note, setNote] = React.useState(appointment.notes ?? "");
  const [photos, setPhotos] = React.useState<string[]>(appointment.referencePhotos ?? []);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const room = MAX_REFERENCE_PHOTOS - photos.length;

  const pick = async (files: FileList | null) => {
    const chosen = Array.from(files ?? []).slice(0, room);
    if (chosen.length === 0) return;
    setError(null);
    setIsPreparing(true);
    try {
      const prepared: string[] = [];
      for (const file of chosen) prepared.push(await prepareReferencePhoto(file));
      setPhotos((current) => [...current, ...prepared]);
    } catch {
      setError(t("booking.photo.error"));
    } finally {
      setIsPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const save = () => {
    onPatch(appointment, { notes: note.trim() || null, referencePhotos: photos });
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-primary/60 bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      data-testid="panel-request-form"
    >
      <Text weight="semibold">{t("calendar.panel.request.title")}</Text>
      <Field label={t("calendar.panel.request.note")}>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder={t("calendar.panel.request.notePlaceholder")} />
      </Field>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void pick(event.target.files)} aria-label={t("booking.photo.add")} />
      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <li key={index} className="relative">
              <img src={photo} alt={t("booking.photo.alt")} className="size-16 rounded-xl object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                className="absolute -right-1.5 -top-1.5 rounded-full shadow-sm"
                onClick={() => setPhotos((current) => current.filter((_, position) => position !== index))}
                aria-label={t("booking.photo.remove")}
              >
                <ThemaIcon name="close" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {room > 0 && (
        <Button type="button" variant="outline" className="self-start" disabled={isPreparing} onClick={() => inputRef.current?.click()}>
          <ThemaIcon name="camera" />
          {isPreparing ? t("booking.photo.preparing") : photos.length > 0 ? t("booking.photo.addMore", { count: room }) : t("calendar.panel.request.addPhoto")}
        </Button>
      )}
      {error && (
        <Text size="xs" tone="negative">
          {error}
        </Text>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={isPreparing} data-testid="panel-request-save">
          {t("calendar.panel.request.save")}
        </Button>
      </div>
    </form>
  );
}
