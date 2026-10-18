import * as React from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { CalendarCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { api, describeError } from "@/lib/api";
import { EmptyState, Spinner } from "@/components/feedback";
import { Text } from "@/components/typography";

const confirmedSchema = z.object({ start: z.string(), client: z.string(), branch: z.string(), confirmedAt: z.string().nullable() });

const WHEN: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" };

/**
 * Lo que abre el botón «Confirmar» del WhatsApp: confirma la cita con el token del enlace, sin
 * pedir código ni sesión (el token es de esa cita y no se adivina). La agenda la marca confirmada.
 */
export function ConfirmAppointmentPage() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const confirm = useMutation({ mutationFn: () => api.post<z.infer<typeof confirmedSchema>>("/booking/confirm", { token }, { schema: confirmedSchema }) });
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    confirm.mutate();
  }, [token, confirm]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6" data-testid="confirm-appointment">
      <div className="w-full max-w-md">
        {!token || confirm.isError ? (
          <EmptyState icon="error" title={t("booking.confirm.failedTitle")} description={token ? describeError(confirm.error).description : t("booking.confirm.noToken")} />
        ) : confirm.data ? (
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-surface p-8 text-center shadow-card">
            <CalendarCheck className="size-10 text-status-positive" aria-hidden />
            <h1 className="text-xl font-semibold text-text-primary">{t("booking.confirm.title", { name: confirm.data.client })}</h1>
            <Text tone="muted">{t("booking.confirm.detail", { when: formatDate(new Date(confirm.data.start), WHEN), branch: confirm.data.branch })}</Text>
          </section>
        ) : (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
      </div>
    </main>
  );
}
