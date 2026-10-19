import * as React from "react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { describeError } from "@/lib/api";
import { Field } from "@/components/forms";
import { DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ABSENCE_KIND_KEYS, absenceKindSchema, useRequestAbsence, type AbsenceKind } from "./workforce";
import { memberName, type TeamMember } from "./types";

export interface AbsenceRequestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  /** Quien gestiona elige a la persona; el resto la pide para sí (lista vacía). */
  members: readonly TeamMember[];
  /** Quien gestiona o el barbero de renta: queda aprobada al crearla. */
  approvesItself: boolean;
}

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/** Pedir (o registrar) vacaciones, una incapacidad o un permiso. */
export function AbsenceRequestDrawer({ open, onOpenChange, branchId, members, approvesItself }: AbsenceRequestDrawerProps) {
  const t = useAppT();
  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} size="md" title={t("team.absence.requestTitle")} description={t(approvesItself ? "team.absence.requestHintDirect" : "team.absence.requestHint")}>
      {open && <AbsenceForm branchId={branchId} members={members} approvesItself={approvesItself} onDone={() => onOpenChange(false)} />}
    </DrawerShell>
  );
}

function AbsenceForm({ branchId, members, approvesItself, onDone }: { branchId: string; members: readonly TeamMember[]; approvesItself: boolean; onDone: () => void }) {
  const t = useAppT();
  const request = useRequestAbsence();
  const [memberId, setMemberId] = React.useState(members[0]?.id ?? "");
  const [kind, setKind] = React.useState<AbsenceKind>("vacation");
  const [startDate, setStart] = React.useState(todayKey);
  const [endDate, setEnd] = React.useState(todayKey);
  const [note, setNote] = React.useState("");
  const valid = startDate !== "" && endDate >= startDate && (members.length === 0 || memberId !== "");

  const submit = () =>
    request.mutate(
      { branchId, kind, startDate, endDate, note: note.trim(), ...(members.length > 0 ? { memberId } : {}) },
      {
        onSuccess: (absence) => {
          toast.success(t(absence.status === "approved" ? "team.absence.created" : "team.absence.requested"), { description: absence.memberName });
          onDone();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );

  return (
    <div className="space-y-4" data-testid="absence-form">
      {members.length > 0 && (
        <Field label={t("team.absence.member")} required>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger data-testid="absence-member">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {memberName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <Field label={t("team.absence.kind")} required>
        <Select value={kind} onValueChange={(value) => setKind(value as AbsenceKind)}>
          <SelectTrigger data-testid="absence-kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {absenceKindSchema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {t(ABSENCE_KIND_KEYS[option])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("team.absence.from")} required>
          <Input type="date" value={startDate} onChange={(event) => setStart(event.target.value)} data-testid="absence-from" />
        </Field>
        <Field label={t("team.absence.to")} required error={endDate < startDate ? t("team.absence.toError") : undefined}>
          <Input type="date" value={endDate} min={startDate} onChange={(event) => setEnd(event.target.value)} data-testid="absence-to" />
        </Field>
      </div>
      <Field label={t("team.absence.note")}>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={300} />
      </Field>
      <Button onClick={submit} disabled={!valid || request.isPending} data-testid="absence-submit">
        {t(approvesItself ? "team.absence.create" : "team.absence.request")}
      </Button>
    </div>
  );
}
