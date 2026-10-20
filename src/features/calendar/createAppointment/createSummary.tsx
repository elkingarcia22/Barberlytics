import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { durationLabel } from "../calendarModel";
import { REPEAT_KEYS, repeatRuleSchema, type RepeatRule } from "../types";
import { useWhenLabel } from "./createModel";
import type { CreateDraft } from "./useCreateDraft";

/**
 * El cierre de «Crear cita»: el total, lo que casi nunca se toca (sin cita
 * previa, repetir, nota) y un único botón principal que dice lo que va a pasar.
 */

const MISSING_KEYS = {
  client: "calendar.createV.missing.client",
  services: "calendar.createV.missing.services",
  barber: "calendar.createV.missing.barber",
  start: "calendar.createV.missing.start",
} as const;

/** «Agendar · Hoy · 3:00 p. m. con Andrés», o lo primero que falta. */
export function SubmitButton({ draft, className, size = "lg" }: { draft: CreateDraft; className?: string; size?: "default" | "lg" }) {
  const t = useAppT();
  const when = useWhenLabel();
  const first = draft.missing[0];
  const label = first ? t(MISSING_KEYS[first]) : t("calendar.createV.submitAt", { when: when(draft.start!, draft.now, draft.ctx.intl), name: draft.barber?.name.split(" ")[0] ?? "" });
  return (
    <Button size={size} className={cn("w-full", className)} onClick={draft.submit} disabled={Boolean(first) || draft.pending} data-testid="create-appointment-submit">
      {!first && <ThemaIcon name="calendarAdd" />}
      {label}
    </Button>
  );
}

/** El total y la duración, para el pie de las propuestas que lo llevan junto al botón. */
export function TotalLine({ draft }: { draft: CreateDraft }) {
  const t = useAppT();
  if (draft.services.length === 0) return null;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Text size="sm" tone="muted">
        {t("calendar.createV.totalLine", { count: draft.services.length, duration: durationLabel(draft.durationMin) })}
      </Text>
      <Text size="lg" weight="semibold" tabular>
        {draft.ctx.formatMoney(draft.price)}
      </Text>
    </div>
  );
}

/** Lo que casi nunca se toca: sin cita previa, repetir y la nota para el barbero. */
export function ExtrasCard({ draft, className }: { draft: CreateDraft; className?: string }) {
  const t = useAppT();
  const walkInId = React.useId();
  return (
    <section className={cn("divide-y divide-border/60 rounded-2xl border border-border bg-surface px-4", className)} data-testid="create-extras">
      <div className="flex items-start justify-between gap-4 py-3.5">
        <label htmlFor={walkInId} className="min-w-0 space-y-0.5">
          <Text as="span" size="sm" weight="medium" className="block">
            {t("calendar.create.walkInSwitch")}
          </Text>
          <Text as="span" size="xs" tone="muted" className="block">
            {t("calendar.createV.walkInShort")}
          </Text>
        </label>
        <Switch id={walkInId} checked={draft.walkIn} onCheckedChange={draft.setWalkIn} data-testid="create-appointment-walkin" />
      </div>
      <div className="py-3.5">
        <Field label={t("calendar.create.repeat")}>
          <Select value={draft.repeat} onValueChange={(value) => draft.setRepeat(value as RepeatRule)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {repeatRuleSchema.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(REPEAT_KEYS[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="py-3.5">
        <Field label={t("calendar.create.notes")}>
          <Textarea value={draft.notes} onChange={(event) => draft.setNotes(event.target.value)} rows={2} placeholder={t("calendar.createV.notesPlaceholder")} />
        </Field>
      </div>
    </section>
  );
}
