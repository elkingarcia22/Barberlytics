import { CheckCircle2, CircleDollarSign, TriangleAlert, UserX, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { AttentionAction, AttentionStrip } from "@/components/feedback";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import type { AppointmentStatus, MetricsBusiness } from "../types";

interface MetricsAlertsProps {
  data: MetricsBusiness;
}

const ALERTS: readonly {
  status: AppointmentStatus;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  icon: typeof UserX;
  tone: "warning" | "negative" | "neutral";
}[] = [
  { status: "pendingCollection", labelKey: "metrics.alert.pending", hintKey: "metrics.alert.pendingHint", icon: CircleDollarSign, tone: "warning" },
  { status: "cancelled", labelKey: "metrics.alert.cancelled", hintKey: "metrics.alert.cancelledHint", icon: XCircle, tone: "negative" },
  { status: "noShow", labelKey: "metrics.alert.noShow", hintKey: "metrics.alert.noShowHint", icon: UserX, tone: "neutral" },
];

/**
 * Lo que del periodo pide una mano: cobros abiertos, cancelaciones y
 * no-shows. Cada aviso abre esas citas en el calendario, filtradas por su
 * estado y por el mismo periodo; producción las dejaba como una cifra muda
 * en la leyenda de un anillo.
 */
export function MetricsAlerts({ data }: MetricsAlertsProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const countOf = (status: AppointmentStatus) => data.appointments.byStatus.find((row) => row.id === status)?.count ?? 0;
  const attention = ALERTS.reduce((sum, alert) => sum + countOf(alert.status), 0);
  const calm = attention === 0;

  const open = (status: AppointmentStatus) =>
    navigate(`/calendario?status=${status}&from=${data.period.from}&to=${data.period.to}`);

  return (
    <AttentionStrip
      label={t("metrics.alert.aria")}
      tone={calm ? "positive" : "warning"}
      icon={calm ? CheckCircle2 : TriangleAlert}
      title={calm ? t("metrics.alert.calmTitle") : t("metrics.alert.title", { count: attention })}
      detail={calm ? t("metrics.alert.calmDetail") : t("metrics.alert.detail")}
    >
      {ALERTS.map((alert) => {
        const count = countOf(alert.status);
        if (count === 0) return null;
        return (
          <AttentionAction
            key={alert.status}
            icon={alert.icon}
            label={t(alert.labelKey)}
            hint={t(alert.hintKey)}
            value={count}
            tone={alert.tone}
            onClick={() => open(alert.status)}
          />
        );
      })}
    </AttentionStrip>
  );
}
