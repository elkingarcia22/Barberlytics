import * as React from "react";
import { Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Chip } from "@/components/ai-interaction";
import { Field } from "@/components/forms";
import { PanelFooter } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { describeError } from "@/lib/api";
import { useRemoveConduct, useReportConduct } from "../queries";
import { CONDUCT_REASON_KEYS, conductReasonSchema, type ConductReason, type ConductReport } from "../types";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * La actitud del cliente: lo que el equipo reporta al cerrar una cita (fue
 * grosero, llegó tomado, regateó…). Se cuenta aparte de las notas porque avisa:
 * sale como etiqueta y aviso en sus próximas citas, en el resumen de «Sobre…»
 * y en su página, donde se puede retirar un reporte hecho por error.
 */

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

function useReasonsLine() {
  const t = useAppT();
  return (report: ConductReport) => report.reasons.map((reason) => t(CONDUCT_REASON_KEYS[reason])).join(" · ");
}

/** El aviso con el último reporte (y cuántos hay): en el resumen del cliente y en su página. */
export function ConductAlert({ model, compact = false }: { model: AppointmentModel; compact?: boolean }) {
  const t = useAppT();
  const reasonsOf = useReasonsLine();
  const [latest] = model.conduct;
  if (!latest) return null;
  const count = model.conduct.length;
  return (
    <Alert variant="destructive" className={compact ? "px-3 py-2" : undefined} data-testid="client-conduct-alert">
      <Flag />
      <AlertTitle>{count > 1 ? t("calendar.conduct.count", { count }) : t("calendar.conduct.tag")}</AlertTitle>
      <AlertDescription>
        <span className="font-medium">{reasonsOf(latest)}</span>
        {latest.text && <span className="block">{latest.text}</span>}
      </AlertDescription>
    </Alert>
  );
}

/** La sección de la página del cliente: cada reporte con quién y cuándo, retirarlo y reportar otro. */
export function ConductSection({ model, onReport }: { model: AppointmentModel; onReport: () => void }) {
  const t = useAppT();
  const { formatDate } = useLocale();
  const reasonsOf = useReasonsLine();
  const remove = useRemoveConduct();
  const known = model.known;
  if (!known) return null;
  const withdraw = (reportId: string) =>
    remove.mutate(
      { clientId: known.id, reportId },
      {
        onSuccess: () => toast.success(t("calendar.conduct.removed")),
        onError: (error) => toast.error(describeError(error).title),
      }
    );
  return (
    <div className="flex flex-col gap-2" data-testid="client-conduct">
      {model.conduct.length === 0 ? (
        <Text size="sm" tone="muted">
          {t("calendar.conduct.none")}
        </Text>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {model.conduct.map((report) => (
            <li key={report.id} className="flex items-start gap-3 px-4 py-3">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text size="sm" weight="medium" tone="negative">
                  {reasonsOf(report)}
                </Text>
                {report.text && <Text size="sm">{report.text}</Text>}
                <Text size="xs" tone="muted">
                  {t("calendar.conduct.meta", { by: report.by, date: formatDate(new Date(report.createdAt), SHORT_DATE) })}
                </Text>
              </span>
              <Button variant="ghost" size="icon-sm" aria-label={t("calendar.conduct.removeTitle")} title={t("calendar.conduct.removeTitle")} disabled={remove.isPending} onClick={() => withdraw(report.id)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="outline" className="self-start" onClick={onReport} data-testid="client-conduct-report">
        <Flag />
        {t("calendar.conduct.report")}
      </Button>
    </div>
  );
}

/** Reportar la actitud, como una página del panel: los motivos, lo que pasó y un solo «Guardar». */
export function ConductPage({ model, onDone }: { model: AppointmentModel; onDone: () => void }) {
  const t = useAppT();
  const report = useReportConduct();
  const [reasons, setReasons] = React.useState<readonly ConductReason[]>([]);
  const [text, setText] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const known = model.known;
  if (!known) return null;
  const needsText = reasons.includes("other");
  const reasonsError = tried && reasons.length === 0 ? t("calendar.conduct.pickOne") : undefined;
  const textError = tried && needsText && text.trim().length < 3 ? t("calendar.conduct.textRequired") : undefined;
  const toggle = (reason: ConductReason) => setReasons((current) => (current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]));
  const submit = () => {
    setTried(true);
    if (reasons.length === 0 || (needsText && text.trim().length < 3)) return;
    report.mutate(
      { clientId: known.id, input: { reasons: [...reasons], text: text.trim(), appointmentId: model.appointment.id } },
      {
        onSuccess: () => {
          toast.success(t("calendar.conduct.saved", { name: model.firstName }));
          onDone();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };
  return (
    <div className="flex flex-col gap-5" data-testid="client-conduct-page">
      <Text size="sm" tone="secondary">
        {t("calendar.conduct.lead")}
      </Text>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("calendar.conduct.reasons")}</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("calendar.conduct.reasons")}>
          {conductReasonSchema.options.map((reason) => {
            const selected = reasons.includes(reason);
            return <Chip key={reason} label={t(CONDUCT_REASON_KEYS[reason])} selected={selected} tone={selected ? "negative" : "default"} onClick={() => toggle(reason)} />;
          })}
        </div>
        {reasonsError && (
          <Text size="xs" tone="negative" role="alert">
            {reasonsError}
          </Text>
        )}
      </fieldset>
      <Field label={needsText ? t("calendar.conduct.text") : t("calendar.conduct.textOptional")} required={needsText} error={textError}>
        <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} placeholder={t("calendar.conduct.textPlaceholder")} data-testid="client-conduct-text" />
      </Field>
      {/* El pie se pinta en el del panel (fuera de este árbol): por eso es un clic y no un `submit`. */}
      <PanelFooter>
        <Button size="lg" className="w-full" disabled={report.isPending} onClick={submit} data-testid="client-conduct-save">
          {t("calendar.conduct.save")}
        </Button>
      </PanelFooter>
    </div>
  );
}
