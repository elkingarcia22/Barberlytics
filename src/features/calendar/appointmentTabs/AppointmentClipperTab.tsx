import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { AIInsightCard } from "@/components/ai";
import { AiGeneratedBadge } from "@/components/ai-interaction";
import { EmptyState } from "@/components/feedback";
import { Text } from "@/components/typography";
import { findClient, type ModelContext } from "../calendarModel";
import { appointmentInsights, type AppointmentInsight } from "../appointmentInsights";
import type { CreateAppointmentInitial } from "../CreateAppointmentDrawer";
import type { Appointment, AppointmentPatch } from "../types";

/**
 * Clipper: lo que el agente sugiere antes de atender, sacado del historial
 * del cliente y de la propia cita. Va en su pestaña para que se lea como lo
 * que es —una sugerencia de la IA— y no se mezcle con los datos de la cita.
 * Una tarjeta por sugerencia, con su acción cuando se puede resolver ahí.
 */

export interface AppointmentClipperTabProps {
  appointment: Appointment;
  ctx: ModelContext;
  onPatch: (appointment: Appointment, patch: AppointmentPatch) => void;
  onRebook: (initial: CreateAppointmentInitial) => void;
}

type InsightCardType = "insight" | "risk" | "recommendation" | "opportunity";
type Confidence = "low" | "medium" | "high";

/** Qué es cada sugerencia: un riesgo, algo que conviene saber o algo que se puede hacer. */
const CARD_TYPE: Record<AppointmentInsight["id"], InsightCardType> = {
  noShowRisk: "risk",
  notRequested: "risk",
  firstVisit: "insight",
  vip: "opportunity",
  upsell: "recommendation",
  rebook: "recommendation",
};

/** Lo que es un dato (visitas, barbero pedido) es seguro; lo que anticipa conducta, menos. */
const CONFIDENCE: Record<AppointmentInsight["id"], Confidence> = {
  noShowRisk: "medium",
  notRequested: "high",
  firstVisit: "high",
  vip: "high",
  upsell: "medium",
  rebook: "medium",
};

export function AppointmentClipperTab({ appointment, ctx, onPatch, onRebook }: AppointmentClipperTabProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const client = findClient(ctx.catalog, appointment.clientId);
  const insights = appointmentInsights(appointment, client, ctx.catalog);
  const heading = t("calendar.insight.byAgent", { name: t("agent.name") });

  const run = (insight: AppointmentInsight) => {
    if (insight.action?.kind === "rebook") onRebook({ clientId: appointment.clientId, serviceId: appointment.serviceIds[0], barberId: appointment.barberId, start: insight.action.date });
    if (insight.action?.kind === "addService") onPatch(appointment, { serviceIds: [...appointment.serviceIds, insight.action.serviceId] });
  };

  const text = (insight: AppointmentInsight) =>
    t(insight.textKey, {
      ...insight.params,
      ...(insight.date ? { date: formatDate(insight.date, { weekday: "long", day: "numeric", month: "long" }) } : {}),
      ...(insight.price === undefined ? {} : { price: ctx.formatMoney(insight.price) }),
    });

  if (insights.length === 0) {
    return <EmptyState icon="sparkles" title={t("calendar.insight.empty")} className="border-none bg-transparent shadow-none" />;
  }

  return (
    <section aria-label={heading} className="space-y-3">
      <div className="flex items-center gap-1.5">
        <AiGeneratedBadge />
        <Text as="span" variant="small" className="text-ai-gradient">
          {heading}
        </Text>
      </div>
      <div className="space-y-3" data-testid="appointment-insights">
        {insights.map((insight) => (
          <AIInsightCard
            key={insight.id}
            type={CARD_TYPE[insight.id]}
            confidence={CONFIDENCE[insight.id]}
            title={text(insight)}
            actionLabel={insight.action ? t(insight.action.kind === "rebook" ? "calendar.insight.rebookAction" : "calendar.insight.addAction") : undefined}
            onAction={insight.action ? () => run(insight) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
