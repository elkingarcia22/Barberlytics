import { Wallet } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { usePayrollQuery } from "@/features/payroll/queries";
import { earnedOf } from "@/features/payroll/payrollUtils";

/**
 * «Hoy ganas»: la pregunta diaria del barbero, en la fila de la agenda y también en el celular. Sale de la
 * misma nómina que «Mi pago» (sus reglas, escala y propinas), así que no hay dos cifras distintas.
 */
export function BarberTodayEarnings({ branchId, memberId, date, formatMoney }: { branchId: string; memberId: string; date: string; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const query = usePayrollQuery({ branchId, from: date, to: date, memberId });
  const member = query.data?.members.find((item) => item.memberId === memberId);
  if (!member) return null;
  const earned = earnedOf(member);
  const label = t("calendar.pulse.earnedToday", { amount: formatMoney(earned), count: member.services });
  return (
    <Text as="span" variant="muted" className="flex items-center gap-1.5 whitespace-nowrap tabular-nums" title={label} data-testid="calendar-earned-today">
      <Wallet className="size-3.5 shrink-0" aria-hidden />
      <span aria-hidden="true">{t("calendar.pulse.earnedShort", { amount: formatMoney(earned) })}</span>
      <span className="sr-only">{label}</span>
    </Text>
  );
}
