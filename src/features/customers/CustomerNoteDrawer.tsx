import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { DrawerShell } from "@/components/overlays";
import { Field } from "@/components/forms";
import { ThemaTabs } from "@/components/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NOTE_KIND_KEYS, noteKindSchema, type NoteKind } from "@/features/calendar/types";
import { useAddCustomerNote } from "./queries";
import { useCustomerRelationship } from "./relationship";
import type { AppMessageKey } from "@/app/i18n/types";

export interface CustomerNoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName: string;
}

const KIND_HINT_KEYS: Readonly<Record<NoteKind, AppMessageKey>> = {
  note: "customers.note.kindNoteHint",
  medication: "customers.note.kindMedicationHint",
  allergy: "customers.note.kindAllergyHint",
};

const MIN_NOTE_LENGTH = 3;

/** Una nota nueva del cliente: qué tipo es —una alergia no se lee igual que una preferencia— y el texto. */
export function CustomerNoteDrawer({ open, onOpenChange, customerId, customerName }: CustomerNoteDrawerProps) {
  const t = useAppT();
  const addNote = useAddCustomerNote();
  const [kind, setKind] = React.useState<NoteKind>("note");
  const [text, setText] = React.useState("");
  // Alergias y medicamentos son datos sensibles: sin el permiso aparte del cliente no se anotan.
  const relationship = useCustomerRelationship(open && customerId ? customerId : "");
  const needsConsent = kind !== "note" && relationship.data !== undefined && relationship.data.consent.health?.accepted !== true;

  const close = () => {
    onOpenChange(false);
    setText("");
    setKind("note");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerId) return;
    addNote.mutate(
      { id: customerId, input: { kind, text: text.trim() } },
      {
        onSuccess: () => {
          toast.success(t("calendar.notes.created"), { description: customerName });
          close();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  return (
    <DrawerShell
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="md"
      title={t("customers.note.title")}
      description={t("customers.note.hint", { name: customerName })}
      actions={
        <>
          <Button type="button" variant="outline" onClick={close} disabled={addNote.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="customer-note-form" disabled={text.trim().length < MIN_NOTE_LENGTH || addNote.isPending || needsConsent} data-testid="customer-note-submit">
            {t("customers.note.save")}
          </Button>
        </>
      }
    >
      <form id="customer-note-form" onSubmit={submit} className="space-y-5">
        {/* Tres opciones cortas en una fila; lo que significa la elegida se lee debajo. */}
        <Field label={t("calendar.notes.type")} required description={t(KIND_HINT_KEYS[kind])}>
          <ThemaTabs className="mb-0" fitContent tabs={noteKindSchema.options.map((option) => ({ id: option, label: t(NOTE_KIND_KEYS[option]) }))} activeTabId={kind} onTabChange={(id) => setKind(id as NoteKind)} />
        </Field>
        {needsConsent && (
          <Alert data-testid="customer-note-needs-consent">
            <ShieldAlert />
            <AlertDescription>{t("customers.privacy.medicalNeedsConsent")}</AlertDescription>
          </Alert>
        )}
        <Field label={t("calendar.notes.description")} required>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} data-testid="customer-note-text" />
        </Field>
      </form>
    </DrawerShell>
  );
}
