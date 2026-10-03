import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { SidePanelShell } from "@/components/overlays";
import { AIInsightCard, AIPanel, type AIInsightType } from "@/components/ai";
import { AIButton } from "@/components/ai-interaction";
import { Field } from "@/components/forms";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/typography";
import { formatClock } from "@/components/scheduling";
import { findClient, type ModelContext } from "./calendarModel";
import { useOpenKey } from "./calendarFormat";
import { parseBookingText } from "./bookingText";
import type { CreateAppointmentInitial } from "./CreateAppointmentDrawer";
import { waitlistMatch, type BriefLine, type WaitlistMatch } from "./dayBrief";
import type { PulseFocus } from "./pulseModel";
import { useWaitlistQuery } from "./queries";
import type { CalendarDay, WaitlistEntry } from "./types";

/**
 * El asistente del día: lo que la agenda pide mirar, como tarjetas de IA del
 * sistema con su acción, y un campo para agendar escribiendo la cita como se
 * dice. Vive en un panel aparte para no ocupar la pantalla de trabajo: se
 * abre cuando se quiere una segunda opinión, no estorba cuando no.
 */

export interface CalendarAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: ModelContext;
  branchId: string;
  date: Date;
  day: CalendarDay | undefined;
  lines: readonly BriefLine[];
  onFocus: (focus: PulseFocus) => void;
  onBarber: (barberId: string) => void;
  onSchedule: (entry: WaitlistEntry, match: WaitlistMatch) => void;
  onBook: (initial: CreateAppointmentInitial) => void;
}

const TYPE: Record<BriefLine["id"], AIInsightType> = { late: "risk", toCollect: "recommendation", allergy: "risk", idle: "opportunity", full: "insight", vip: "insight", new: "insight" };
const FOCUS: Partial<Record<BriefLine["id"], PulseFocus>> = { late: "late", toCollect: "toCollect" };

export function CalendarAssistantDrawer(props: CalendarAssistantDrawerProps) {
  return <AssistantPanel key={useOpenKey(props.open)} {...props} />;
}

function AssistantPanel({ open, onOpenChange, ctx, branchId, date, day, lines, onFocus, onBarber, onSchedule, onBook }: CalendarAssistantDrawerProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const waitlist = useWaitlistQuery(branchId, null, open);
  const [text, setText] = React.useState("");

  const offers = (waitlist.data?.items ?? [])
    .map((entry) => ({ entry, match: day ? waitlistMatch(entry, day, ctx.catalog, date, ctx.now) : null }))
    .filter((item): item is { entry: WaitlistEntry; match: WaitlistMatch } => item.match !== null);

  const parsed = text.trim().length > 3 ? parseBookingText(text, ctx.catalog, ctx.now ?? new Date()) : null;
  const understood = parsed
    ? [parsed.client, parsed.service, parsed.barber, parsed.when ? `${formatDate(parsed.when, { weekday: "long", day: "numeric", month: "short" })}, ${formatClock(parsed.when, ctx.intl)}` : undefined].filter(Boolean)
    : [];

  const book = () => {
    if (!parsed) return;
    onOpenChange(false);
    onBook(parsed.initial);
  };

  return (
    <SidePanelShell open={open} onOpenChange={onOpenChange} size="lg" title={t("calendar.assistant.title")} description={t("calendar.assistant.hint")}>
      <div className="space-y-4" data-testid="calendar-assistant">
        <AIPanel title={t("calendar.assistant.bookTitle")} description={t("calendar.assistant.bookHint")}>
          <Field label={t("calendar.assistant.bookLabel")} description={understood.length > 0 ? t("calendar.assistant.understood", { parts: understood.join(" · ") }) : t("calendar.assistant.example")}>
            <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} placeholder={t("calendar.assistant.placeholder")} data-testid="calendar-assistant-text" />
          </Field>
          <div className="flex justify-end" data-testid="calendar-assistant-book">
            <AIButton variant="primary" size="sm" disabled={understood.length === 0} onClick={book}>
              {t("calendar.assistant.book")}
            </AIButton>
          </div>
        </AIPanel>

        <AIPanel
          title={t("calendar.assistant.dayTitle")}
          description={t("calendar.assistant.dayHint")}
          empty={lines.length === 0 && offers.length === 0}
          emptyState={<Text variant="muted">{t("calendar.assistant.calm")}</Text>}
        >
          {offers.map(({ entry, match }) => {
            const client = findClient(ctx.catalog, entry.clientId);
            return (
              <AIInsightCard
                key={entry.id}
                type="opportunity"
                title={t("calendar.assistant.offerTitle", { name: client?.name ?? "" })}
                description={t("calendar.assistant.offerHint", { time: formatClock(match.start, ctx.intl), barber: match.barber.name })}
                actionLabel={t("calendar.waitlist.offer")}
                onAction={() => {
                  onOpenChange(false);
                  onSchedule(entry, match);
                }}
              />
            );
          })}
          {lines.map((line) => {
            const focus = FOCUS[line.id];
            const barberId = line.barberId;
            const action = focus
              ? { label: t("calendar.assistant.seeThem"), run: () => onFocus(focus) }
              : barberId
                ? { label: t("calendar.assistant.seeAgenda"), run: () => onBarber(barberId) }
                : null;
            return (
              <AIInsightCard
                key={line.id}
                type={TYPE[line.id]}
                title={t(line.textKey, line.params)}
                description={t(`calendar.assistant.why.${line.id}`)}
                actionLabel={action?.label}
                onAction={
                  action
                    ? () => {
                        onOpenChange(false);
                        action.run();
                      }
                    : undefined
                }
              />
            );
          })}
        </AIPanel>
      </div>
    </SidePanelShell>
  );
}
