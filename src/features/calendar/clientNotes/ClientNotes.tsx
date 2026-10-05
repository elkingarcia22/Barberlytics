import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Chip } from "@/components/ai-interaction";
import { RowActionsMenu, type RowAction } from "@/components/data-display";
import { Field } from "@/components/forms";
import { ConfirmDialog } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRemoveClientNote, useUpdateClientNote } from "../queries";
import { NOTE_KIND_KEYS, type ClientNote, type NoteKind } from "../types";

/**
 * Las notas de un cliente, iguales en la cita y en su ficha: el filtro por tipo
 * (chips con su contador) y la lista, donde cada nota se corrige o se borra
 * desde su menú. Una nota es del cliente, no de la pantalla: cambiarla aquí la
 * cambia en todas partes.
 */

export const MIN_NOTE_LENGTH = 3;
const DATE_LONG: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

export interface NoteKindChipsProps {
  kinds: readonly NoteKind[];
  value: NoteKind;
  onChange: (kind: NoteKind) => void;
  notes: readonly ClientNote[];
}

/** Chips y no pestañas: el filtro vive dentro de una pestaña o de una tarjeta. */
export function NoteKindChips({ kinds, value, onChange, notes }: NoteKindChipsProps) {
  const t = useAppT();
  return (
    <div role="group" aria-label={t("calendar.notes.type")} className="flex flex-wrap gap-2" data-testid="notes-kind">
      {kinds.map((kind) => (
        <Chip
          key={kind}
          size="sm"
          label={t(NOTE_KIND_KEYS[kind])}
          count={notes.filter((note) => note.kind === kind).length}
          selected={value === kind}
          tone={value === kind ? "primary" : "default"}
          onClick={() => onChange(kind)}
        />
      ))}
    </div>
  );
}

export interface ClientNoteListProps {
  clientId: string;
  /** Las notas a enseñar, ya filtradas por tipo. */
  notes: readonly ClientNote[];
  /** Los tipos a los que se puede pasar una nota al corregirla (sin permiso médico, solo «Notas»). */
  kinds: readonly NoteKind[];
  "data-testid"?: string;
}

export function ClientNoteList({ clientId, notes, kinds, "data-testid": testId }: ClientNoteListProps) {
  const t = useAppT();
  if (notes.length === 0) return <Text variant="muted">{t("calendar.notes.empty")}</Text>;
  return (
    <ul className="space-y-2" data-testid={testId}>
      {notes.map((note) => (
        <ClientNoteItem key={note.id} clientId={clientId} note={note} kinds={kinds} />
      ))}
    </ul>
  );
}

function ClientNoteItem({ clientId, note, kinds }: { clientId: string; note: ClientNote; kinds: readonly NoteKind[] }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const update = useUpdateClientNote();
  const remove = useRemoveClientNote();
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [kind, setKind] = React.useState<NoteKind>(note.kind);
  const [text, setText] = React.useState(note.text);

  const startEditing = () => {
    setKind(note.kind);
    setText(note.text);
    setEditing(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    update.mutate(
      { clientId, noteId: note.id, input: { kind, text: text.trim() } },
      {
        onSuccess: () => {
          toast.success(t("calendar.notes.updated"));
          setEditing(false);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  const confirmRemove = () => {
    remove.mutate(
      { clientId, noteId: note.id },
      {
        onSuccess: () => {
          toast.success(t("calendar.notes.deleted"));
          setConfirming(false);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  const actions: RowAction[] = [
    { id: "edit", label: t("common.edit"), icon: <Pencil />, onSelect: startEditing },
    { id: "delete", label: t("common.delete"), icon: <Trash2 />, tone: "danger", onSelect: () => setConfirming(true) },
  ];

  if (editing) {
    return (
      <li className="rounded-lg border border-border/60 p-3" data-testid="client-note-editing">
        <form className="space-y-3" onSubmit={save}>
          {kinds.length > 1 && (
            <Field label={t("calendar.notes.type")} required>
              <Select value={kind} onValueChange={(value) => setKind(value as NoteKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(NOTE_KIND_KEYS[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label={t("calendar.notes.description")} required>
            <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} autoFocus data-testid="client-note-edit-text" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={update.isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={text.trim().length < MIN_NOTE_LENGTH || update.isPending} data-testid="client-note-save">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2 rounded-lg border border-border/60 p-3" data-testid="client-note">
      <div className="min-w-0 flex-1">
        <Text className="whitespace-pre-line break-words">{note.text}</Text>
        <Text variant="caption">{formatDate(new Date(note.createdAt), DATE_LONG)}</Text>
      </div>
      <RowActionsMenu actions={actions} rowLabel={note.text} />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        variant="destructive"
        title={t("calendar.notes.deleteTitle")}
        description={t("calendar.notes.deleteHint")}
        confirmLabel={t("common.delete")}
        loading={remove.isPending}
        onConfirm={confirmRemove}
      />
    </li>
  );
}
