import * as React from "react";
import { NotebookPen, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection } from "@/components/overlays";
import { Field } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/typography";
import { EmptyState } from "@/components/feedback";
import { useAddClientNote } from "../queries";
import { ClientNoteList, MIN_NOTE_LENGTH, NoteKindChips } from "../clientNotes/ClientNotes";
import { NOTE_KIND_KEYS, noteKindSchema, type Client, type NoteKind } from "../types";

/**
 * Notas: las del cliente filtradas por tipo —Notas, Medicamento, Alergias—
 * con chips y su contador, el formulario para agregar una sin salir de la
 * cita y, en cada nota, su menú para corregirla o borrarla. Chips y no otra
 * tira de pestañas: esto ya vive dentro de la pestaña «Notas» del panel.
 */

export interface AppointmentNotesTabProps {
  client: Client | null;
}

export function AppointmentNotesTab({ client }: AppointmentNotesTabProps) {
  const t = useAppT();
  const [kind, setKind] = React.useState<NoteKind>("note");
  const [adding, setAdding] = React.useState(false);
  const [draftKind, setDraftKind] = React.useState<NoteKind>("note");
  const [text, setText] = React.useState("");
  const addNote = useAddClientNote();

  if (!client || client.type === "walkin") {
    return <Text variant="muted">{t("calendar.notes.walkIn")}</Text>;
  }

  const visible = client.notes.filter((note) => note.kind === kind);
  const hasAny = client.notes.length > 0;

  const submit = () => {
    addNote.mutate(
      { clientId: client.id, input: { kind: draftKind, text: text.trim() } },
      {
        onSuccess: () => {
          toast.success(t("calendar.notes.created"));
          setText("");
          setAdding(false);
          setKind(draftKind);
        },
        onError: (error) => toast.error(describeError(error).title),
      }
    );
  };

  return (
    <DrawerSection
      icon={NotebookPen}
      tone="neutral"
      title={t("calendar.notes.title")}
      hint={t("calendar.notes.hint")}
      badge={String(client.notes.length)}
      action={
        // Sin ninguna nota, el botón vive en el estado vacío: dos «Agregar nota» juntos sobran.
        hasAny ? (
          <Button size="xs" variant="outline" onClick={() => setAdding((current) => !current)}>
            <Plus /> {t("calendar.notes.add")}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Los filtros por tipo solo cuando hay algo que filtrar. */}
        {hasAny && <NoteKindChips kinds={noteKindSchema.options} value={kind} onChange={setKind} notes={client.notes} />}
        {adding && (
          <form
            className="space-y-3 rounded-lg bg-surface-subtle p-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Field label={t("calendar.notes.type")} required>
              <Select value={draftKind} onValueChange={(value) => setDraftKind(value as NoteKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteKindSchema.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(NOTE_KIND_KEYS[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("calendar.notes.description")} required>
              <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={text.trim().length < MIN_NOTE_LENGTH || addNote.isPending}>
                {t("calendar.notes.create")}
              </Button>
            </div>
          </form>
        )}
        {visible.length === 0 && !adding ? (
          // Sin notas de este tipo: el porqué y el botón para dejar la primera, en el mismo recuadro.
          <EmptyState
            icon="file"
            title={t("calendar.notes.emptyTitle", { kind: t(NOTE_KIND_KEYS[kind]).toLowerCase() })}
            description={t("calendar.notes.emptyHint")}
            className="border-none bg-transparent shadow-none"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraftKind(kind);
                  setAdding(true);
                }}
                data-testid="client-notes-empty-add"
              >
                <Plus /> {t("calendar.notes.add")}
              </Button>
            }
          />
        ) : (
          <ClientNoteList clientId={client.id} notes={visible} kinds={noteKindSchema.options} />
        )}
      </div>
    </DrawerSection>
  );
}
