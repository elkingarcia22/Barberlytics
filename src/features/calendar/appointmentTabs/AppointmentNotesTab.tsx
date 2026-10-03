import * as React from "react";
import { NotebookPen, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { DrawerSection } from "@/components/overlays";
import { ThemaTabs } from "@/components/navigation";
import { Field } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/typography";
import { useAddClientNote } from "../queries";
import {
  NOTE_KIND_KEYS,
  noteKindSchema,
  type Client,
  type NoteKind,
} from "../types";

/**
 * Notas: las del cliente en tres pestañas —Notas, Medicamento, Alergias—
 * con su contador, y el formulario para agregar una sin salir de la cita.
 */

export interface AppointmentNotesTabProps {
  client: Client | null;
  branchId: string;
}

export function AppointmentNotesTab({
  client,
  branchId,
}: AppointmentNotesTabProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const [kind, setKind] = React.useState<NoteKind>("note");
  const [adding, setAdding] = React.useState(false);
  const [draftKind, setDraftKind] = React.useState<NoteKind>("note");
  const [text, setText] = React.useState("");
  const addNote = useAddClientNote(branchId);

  if (!client || client.type === "walkin") {
    return <Text variant="muted">{t("calendar.notes.walkIn")}</Text>;
  }

  const notes = client.notes.filter((note) => note.kind === kind);
  const count = (of: NoteKind) =>
    client.notes.filter((note) => note.kind === of).length;

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
      },
    );
  };

  return (
    <div className="space-y-3">
      <ThemaTabs
        className="mb-0"
        fitContent
        tabs={noteKindSchema.options.map((option) => ({
          id: option,
          label: t(NOTE_KIND_KEYS[option]),
          badge: count(option),
        }))}
        activeTabId={kind}
        onTabChange={(id) => setKind(id as NoteKind)}
      />
      <DrawerSection
        icon={NotebookPen}
        tone="neutral"
        title={t(NOTE_KIND_KEYS[kind])}
        hint={t("calendar.client.visitsHint")}
        badge={String(notes.length)}
        action={
          <Button
            size="xs"
            variant="outline"
            onClick={() => setAdding((current) => !current)}
          >
            <Plus /> {t("calendar.notes.add")}
          </Button>
        }
      >
        <div className="space-y-3">
          {adding && (
            <form
              className="space-y-3 rounded-lg bg-surface-subtle p-3"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <Field label={t("calendar.notes.type")} required>
                <Select
                  value={draftKind}
                  onValueChange={(value) => setDraftKind(value as NoteKind)}
                >
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
                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={3}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdding(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={text.trim().length < 3 || addNote.isPending}
                >
                  {t("calendar.notes.create")}
                </Button>
              </div>
            </form>
          )}
          {notes.length === 0 ? (
            <Text variant="muted">{t("calendar.notes.empty")}</Text>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <Text>{note.text}</Text>
                  <Text variant="caption">
                    {formatDate(new Date(note.createdAt), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerSection>
    </div>
  );
}
