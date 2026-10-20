import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/features/access";
import { useBranchId } from "../teamUtils";
import { useClockAction, useClockStatus } from "./operationsApi";

const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
/** Quien ficha: los empleados. El dueño y el barbero de renta llevan su propio tiempo. */
const CLOCKS = ["admin", "recepcion", "barbero-comision"];

/**
 * Fichar desde la cabecera: «Marcar entrada» y, ya en turno, «Salida» con la hora de entrada. Solo para quien ficha; el
 * servidor vuelve a mirarlo. Lo que se marca lo ve gerencia en Horas de trabajo › Fichajes.
 */
export function ClockInButton() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const access = useAccess();
  const branchId = useBranchId();
  const enabled = CLOCKS.includes(access.role);
  const status = useClockStatus(branchId, enabled);
  const action = useClockAction(branchId);
  if (!enabled || !status.data?.canClock) return null;
  const open = status.data.open;
  const run = (next: "in" | "out") =>
    action.mutate(next, {
      onSuccess: () => toast.success(t(next === "in" ? "team.clock.inDone" : "team.clock.outDone", { time: formatDate(new Date(), TIME) })),
      onError: (error) => toast.error(describeError(error).description),
    });

  return open ? (
    <Button size="sm" variant="outline" onClick={() => run("out")} disabled={action.isPending} aria-label={t("team.clock.outAria", { time: formatDate(new Date(open.clockIn), TIME) })} data-testid="clock-out">
      <LogOut /> <span className="hidden sm:inline">{t("team.clock.out", { time: formatDate(new Date(open.clockIn), TIME) })}</span>
    </Button>
  ) : (
    <Button size="sm" onClick={() => run("in")} disabled={action.isPending} aria-label={t("team.clock.in")} title={status.data.shift ? t("team.clock.shift", { start: status.data.shift.start, end: status.data.shift.end }) : undefined} data-testid="clock-in">
      <LogIn /> <span className="hidden sm:inline">{t("team.clock.in")}</span>
    </Button>
  );
}
