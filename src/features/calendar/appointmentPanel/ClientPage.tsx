import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { ProgressRing } from "@/components/data-display/ProgressRing";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Stepper, ThemaTabs } from "@/components/navigation";
import { AppointmentNotesTab } from "../appointmentTabs/AppointmentNotesTab";
import { JOURNEY, type ModelContext } from "../calendarModel";
import { CLIENT_TYPE_KEYS } from "../types";
import { ActionButton, CriticalAlerts, LoyaltyStrip } from "./PanelParts";
import { ConductAlert, ConductSection } from "./ClientConduct";
import { LoyaltyFacts, VisitGaps, VisitList } from "./ClientHistory";
import { lastVisitOf, useClientVisits } from "./clientVisits";
import type { ClientTab } from "./clientHighlightsModel";
import { NavRow } from "./bookingStyle";
import { LOYALTY_EVERY, type AppointmentModel } from "./useAppointmentModel";

/**
 * El cliente dentro del panel (la tarjeta de la cita está en `ClientField`):
 * la fila que resume quién es y lleva a su página. La página va en cuatro
 * pestañas, por lo que se pregunta: «Resumen» (membresía, si cumple, su
 * recorrido nuevo → VIP, contacto y la ficha completa), «Cuidado» (actitud
 * reportada, alergias y medicamentos, y sus notas), «Visitas» (su ritmo, los
 * días entre visitas y todas las visitas) y «Fidelidad» (con qué barbero se
 * queda). Cada punto de «Sobre {nombre}» abre la suya.
 */

const LONG_DATE: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

/** La fila del cliente: tipo, visita de la membresía y ritmo; lleva a su página. */
export function ClientSummaryRow({ model, onOpen }: { model: AppointmentModel; onOpen: () => void }) {
  const t = useAppT();
  const { known } = model;
  if (!known) return null;
  const parts = [t("calendar.panel.client.membershipShort", { count: model.loyaltyProgress, total: LOYALTY_EVERY }), known.visitEveryDays ? t("calendar.client.every", { days: known.visitEveryDays }) : null].filter(Boolean);
  return (
    <NavRow
      leading={
        <ProgressRing size="md" value={model.loyaltyProgress} max={LOYALTY_EVERY} aria-label={t("calendar.panel.loyalty.count", { count: model.loyaltyProgress, total: LOYALTY_EVERY })}>
          <Text as="span" size="xs" weight="semibold" tabular>
            {model.loyaltyProgress}
          </Text>
        </ProgressRing>
      }
      title={t("calendar.panel.client.rowTitle", { type: t(CLIENT_TYPE_KEYS[known.type]) })}
      description={parts.join(" · ")}
      onClick={onOpen}
      testId="panel-client-row"
    />
  );
}

/** Un grupo de la página del cliente: su título y lo suyo en una tarjeta. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <Text size="sm" weight="medium">
        {title}
      </Text>
      {children}
    </section>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text size="sm" weight="medium" tabular className="text-right first-letter:uppercase">
        {value}
      </Text>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "negative" }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface-subtle px-3 py-2.5">
      <Text size="xs" tone="muted">
        {label}
      </Text>
      <Text size="lg" weight="semibold" tabular tone={tone}>
        {value}
      </Text>
    </div>
  );
}

export interface ClientPageContentProps {
  model: AppointmentModel;
  ctx: ModelContext;
  onOpenClient: (clientId: string) => void;
  /** Reportar su actitud: una página del panel. */
  onReportConduct: () => void;
  /** La pestaña con que abre (la del punto que se tocó en el resumen). */
  initialTab?: ClientTab;
}

const TABS: readonly ClientTab[] = ["summary", "care", "visits", "loyalty"];

export function ClientPageContent({ model, ctx, onOpenClient, onReportConduct, initialTab = "summary" }: ClientPageContentProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const [tab, setTab] = React.useState<ClientTab>(initialTab);
  const { known } = model;
  const visits = useClientVisits(known?.id);
  if (!known) return <Text tone="muted">{t("calendar.notes.walkIn")}</Text>;
  const today = ctx.now ?? new Date();
  const lastVisit = lastVisitOf(visits.appointments, model.lastVisit);
  const daysSince = lastVisit ? differenceInCalendarDays(today, lastVisit) : null;
  const careCount = model.conduct.length + model.critical.length;

  return (
    <div className="flex flex-col gap-5" data-testid="panel-client-page">
      <ThemaTabs
        className="mb-0"
        tabs={TABS.map((id) => ({ id, label: t(`calendar.panel.client.tab.${id}`), ...(id === "care" && careCount > 0 ? { badge: careCount, badgeTone: model.conduct.length > 0 ? ("negative" as const) : ("warning" as const) } : {}) }))}
        activeTabId={tab}
        onTabChange={(id) => setTab(id as ClientTab)}
      />

      {tab === "summary" && (
        <div className="flex flex-col gap-6" data-testid="panel-client-tab-summary">
          {/* La membresía ya trae su rótulo: sin título encima. */}
          <LoyaltyStrip model={model} />
          <Group title={t("calendar.panel.client.reliability")}>
            <div className="grid grid-cols-3 gap-2">
              <Stat label={t("calendar.panel.client.visits")} value={String(known.visits)} />
              <Stat label={t("calendar.client.noShows")} value={String(known.noShows)} tone={known.noShows > 0 ? "negative" : undefined} />
              <Stat label={t("calendar.client.cancelled")} value={String(known.cancellations)} />
            </div>
          </Group>
          <Group title={t("calendar.panel.client.journey")}>
            <Stepper size="sm" aria-label={t("calendar.panel.client.journey")} current={Math.max(0, JOURNEY.indexOf(known.type))} steps={JOURNEY.map((type) => ({ id: type, label: t(CLIENT_TYPE_KEYS[type]) }))} />
          </Group>
          {model.phone && (
            <Group title={t("calendar.panel.client.contact")}>
              <div className="rounded-2xl border border-border bg-surface px-4 py-2">
                <div className="flex items-center justify-between gap-4 py-1.5">
                  <span className="flex min-w-0 flex-col">
                    <Text size="sm" tone="secondary" tabular>
                      {known.phone}
                    </Text>
                    <Text size="xs" tone="muted" truncate>
                      {model.email || t("calendar.panel.write.noEmail")}
                    </Text>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <ActionButton model={model} action="call" variant="ghost" size="sm" iconOnly />
                    <ActionButton model={model} action="message" variant="ghost" size="sm" iconOnly />
                  </span>
                </div>
              </div>
            </Group>
          )}
          <Button variant="outline" onClick={() => onOpenClient(known.id)}>
            {t("calendar.client.openProfile")}
          </Button>
        </div>
      )}

      {tab === "care" && (
        <div className="flex flex-col gap-6" data-testid="panel-client-tab-care">
          {(model.critical.length > 0 || model.conduct.length > 0) && (
            <Group title={t("calendar.panel.client.careTitle")}>
              <ConductAlert model={model} compact />
              <CriticalAlerts model={model} compact />
            </Group>
          )}
          {/* Las notas del cliente: verlas por tipo, dejar una nueva y corregir o borrar cada una, como en la pestaña «Notas». */}
          <AppointmentNotesTab client={known} />
          <Group title={t("calendar.conduct.title")}>
            <ConductSection model={model} onReport={onReportConduct} />
          </Group>
        </div>
      )}

      {tab === "visits" && (
        <div className="flex flex-col gap-6" data-testid="panel-client-tab-visits">
          <Group title={t("calendar.panel.client.rhythmTitle")}>
            <div className="rounded-2xl border border-border bg-surface px-4 py-2">
              <Fact label={t("calendar.panel.client.comesEvery")} value={known.visitEveryDays ? t("calendar.client.every", { days: known.visitEveryDays }) : t("calendar.client.noRhythm")} />
              <Fact label={t("calendar.client.lastVisit")} value={lastVisit ? `${formatDate(lastVisit, LONG_DATE)}${daysSince !== null ? ` · ${t("calendar.panel.client.lastValue", { days: daysSince })}` : ""}` : "—"} />
              <Fact label={t("calendar.panel.client.nextVisit")} value={model.nextVisit ? formatDate(model.nextVisit, LONG_DATE) : "—"} />
              <div className="pb-2">
                <VisitGaps appointments={visits.appointments} />
              </div>
            </div>
          </Group>
          <Group title={t("calendar.panel.client.visitsTitle")}>
            <VisitList ctx={ctx} appointments={visits.appointments} isLoading={visits.isLoading} isError={visits.isError} />
          </Group>
        </div>
      )}

      {tab === "loyalty" && (
        <div className="flex flex-col gap-6" data-testid="panel-client-tab-loyalty">
          <Group title={t("calendar.panel.client.loyaltyTitle")}>
            <LoyaltyFacts model={model} ctx={ctx} appointments={visits.appointments} />
          </Group>
        </div>
      )}
    </div>
  );
}
