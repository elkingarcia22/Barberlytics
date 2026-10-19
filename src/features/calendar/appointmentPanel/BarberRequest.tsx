import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ActionTile } from "@/components/utility";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { MAX_REFERENCE_PHOTOS, prepareReferencePhoto } from "@/features/booking/flow/referencePhoto";
import type { Appointment, AppointmentPatch } from "../types";
import { ReferencePhotos } from "./PanelParts";
import { SourceLine } from "./SourceLine";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * «Para el barbero»: el comentario y las fotos del corte que llegan con la
 * cita. Si vino de la reserva en línea, es lo que el cliente escribió y subió;
 * desde la agenda también se deja o se corrige (lo que el cliente dijo por
 * teléfono, la foto que mostró en el mostrador), con las mismas reglas que la
 * reserva: hasta tres fotos, reducidas antes de guardarlas.
 */

export interface BarberRequestProps {
  model: AppointmentModel;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
}

export function BarberRequest({ model, onPatch }: BarberRequestProps) {
  const t = useAppT();
  const { appointment } = model;
  const [editing, setEditing] = React.useState(false);
  const photos = appointment.referencePhotos ?? [];
  const hasContent = Boolean(appointment.notes) || photos.length > 0;
  const editable = model.unpaid;

  if (editing) return <BarberRequestForm model={model} onPatch={onPatch} onDone={() => setEditing(false)} />;

  if (!hasContent) {
    if (!editable) return null;
    return (
      <ActionTile
        tone="dashed"
        leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name="camera" />} />}
        title={t("calendar.panel.request.add")}
        description={t("calendar.panel.request.addHint")}
        onClick={() => setEditing(true)}
      />
    );
  }

  return (
    <section aria-label={t("calendar.panel.request.title")} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4" data-testid="panel-request">
      <div className="flex items-center gap-3">
        <IconTile size="md" shape="circle" tone="primary" icon={<ThemaIcon name={appointment.source === "online" ? "globe" : "edit"} />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text weight="semibold">{t("calendar.panel.request.title")}</Text>
          <SourceLine appointment={appointment} />
        </span>
        {editable && (
          <Button variant="ghost" size="xs" onClick={() => setEditing(true)} data-testid="panel-request-edit">
            <ThemaIcon name="edit" /> {t("action.edit")}
          </Button>
        )}
      </div>
      {appointment.notes && <Text className="border-l-2 border-primary/60 pl-3 italic">«{appointment.notes}»</Text>}
      <ReferencePhotos model={model} />
    </section>
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
