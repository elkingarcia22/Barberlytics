import { useNavigate } from "react-router";
import { UserRound } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { DrawerShell } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/typography";
import { PayrollAdjustments } from "./PayrollAdjustments";
import { PAYOUT_KEYS, RULE_KEYS, ruleSchema, type CommissionRule, type PayrollMember } from "./types";

export interface PayrollMemberDrawerProps {
  /** El barbero abierto; `null` cierra el panel. */
  member: PayrollMember | null;
  onClose: () => void;
  formatMoney: (value: number) => string;
  /**
   * El enlace a sus reglas en Equipo. Solo para quien gestiona los pagos del
   * equipo (`barber-payments`); el barbero que mira su propio pago no lo tiene.
   */
  showRulesLink?: boolean;
  /** El periodo y si ya está aprobado: con él se ven y se añaden los ajustes. Sin él, no hay ajustes (el barbero mirando lo suyo). */
  adjustments?: { period: { branchId: string; from: string; to: string }; locked: boolean; canManage: boolean };
}

const DATE_TIME: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" };

/**
 * Cómo se llega al pago de un barbero: su forma de pago y sus reglas, la
 * cuenta —lo que suma y lo que resta— y servicio por servicio qué regla se
 * aplicó. Las reglas se cambian en su ficha de Equipo, no aquí.
 */
export function PayrollMemberDrawer({ member, onClose, formatMoney, showRulesLink = true, adjustments }: PayrollMemberDrawerProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatDate } = useLocale();

  return (
    <DrawerShell
      open={member !== null}
      onOpenChange={(open) => !open && onClose()}
      size="xl"
      title={member?.name}
      description={member ? t(PAYOUT_KEYS[member.payout]) : undefined}
      actions={
        member &&
        showRulesLink && (
          <Button variant="outline" onClick={() => navigate(`/usuarios/miembros/${member.memberId}?pestana=${member.payout === "rent" ? "pagos" : "compensacion"}`)}>
            <UserRound /> {t("payroll.detail.seeRules")}
          </Button>
        )
      }
    >
      {member && (
        <div className="space-y-6" data-testid="payroll-detail">
          <section aria-label={t("payroll.detail.rules")} className="space-y-2">
            <Text variant="label">{t("payroll.detail.rules")}</Text>
            <Rules member={member} formatMoney={formatMoney} />
          </section>

          <section aria-label={t("payroll.detail.math")} className="rounded-xl bg-surface-subtle p-4">
            <dl className="space-y-2 text-sm">
              {member.payout !== "rent" && member.serviceCommission > 0 && <Row label={t("payroll.column.serviceCommission")} value={`+${formatMoney(member.serviceCommission)}`} />}
              {member.productCommission > 0 && <Row label={t("payroll.column.productCommission")} value={`+${formatMoney(member.productCommission)}`} />}
              {member.salary > 0 && <Row label={t("payroll.column.salary")} value={`+${formatMoney(member.salary)}`} />}
              <Row label={t("payroll.column.tips")} value={`+${formatMoney(member.tips)}`} />
              {member.rent > 0 && <Row label={t("payroll.column.rent")} value={`−${formatMoney(member.rent)}`} negative />}
              {member.deductions > 0 && <Row label={t("payroll.column.deductions")} value={`−${formatMoney(member.deductions)}`} negative />}
              {(member.adjustmentsTotal ?? 0) !== 0 && (
                <Row label={t("payroll.column.adjustments")} value={`${(member.adjustmentsTotal ?? 0) > 0 ? "+" : "−"}${formatMoney(Math.abs(member.adjustmentsTotal ?? 0))}`} negative={(member.adjustmentsTotal ?? 0) < 0} />
              )}
              <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2">
                <dt className="font-semibold text-text-primary">{member.net < 0 ? t("payroll.detail.owes") : t("payroll.detail.toPay")}</dt>
                <dd className={member.net < 0 ? "text-lg font-semibold tabular-nums text-status-warning" : "text-lg font-semibold tabular-nums text-text-primary"}>{formatMoney(Math.abs(member.net))}</dd>
              </div>
            </dl>
          </section>

          {adjustments && <PayrollAdjustments member={member} period={adjustments.period} locked={adjustments.locked} canManage={adjustments.canManage} formatMoney={formatMoney} />}

          <section aria-label={t("payroll.detail.lines")} className="space-y-2">
            <Text variant="label">{t("payroll.detail.linesCount", { count: member.lines.length })}</Text>
            {member.lines.length === 0 ? (
              <Text variant="muted">{t("payroll.detail.noLines")}</Text>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("payroll.line.date")}</TableHead>
                      <TableHead>{t("payroll.line.client")}</TableHead>
                      <TableHead>{t("payroll.line.service")}</TableHead>
                      <TableHead>{t("payroll.line.rule")}</TableHead>
                      <TableHead className="text-right">{t("payroll.line.sale")}</TableHead>
                      <TableHead className="text-right">{member.payout === "rent" ? t("payroll.column.deductions") : t("payroll.line.commission")}</TableHead>
                      <TableHead className="text-right">{t("payroll.column.tips")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.lines.map((line) => (
                      <TableRow key={line.appointmentId}>
                        <TableCell className="whitespace-nowrap tabular-nums text-text-secondary">{formatDate(new Date(line.date), DATE_TIME)}</TableCell>
                        <TableCell className="text-text-primary">{line.client}</TableCell>
                        <TableCell className="text-text-secondary">{line.service}</TableCell>
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          {t(RULE_KEYS[line.rule])}
                          {line.rate !== null && <span className="text-text-muted"> · {line.rate}%</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(line.sale)}</TableCell>
                        <TableCell className="text-right tabular-nums">{member.payout === "rent" ? (line.deduction > 0 ? `−${formatMoney(line.deduction)}` : "—") : formatMoney(line.commission)}</TableCell>
                        <TableCell className="text-right tabular-nums text-text-secondary">{line.tip > 0 ? formatMoney(line.tip) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}
    </DrawerShell>
  );
}

function Rules({ member, formatMoney }: { member: PayrollMember; formatMoney: (value: number) => string }) {
  const t = useAppT();
  if (member.payout === "rent") return <Text variant="muted">{t("payroll.detail.rentRule", { amount: formatMoney(member.rentBase ?? 0) })}</Text>;
  if (member.payout === "salary") return <Text variant="muted">{t("payroll.detail.salaryRule", { amount: formatMoney(member.salaryBase ?? 0) })}</Text>;
  const rules = member.rules;
  if (!rules) return null;
  if (rules.type === "scale" && rules.scale.length > 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {rules.scale.map((tier) => (
          <Badge key={tier.from} variant="neutral">
            {t("payroll.detail.tier", { from: formatMoney(tier.from), percent: tier.percent })}
          </Badge>
        ))}
      </div>
    );
  }
  const rateOf = (rule: CommissionRule) => (rule === "basic" ? rules.basic : (rules[rule] ?? rules.basic));
  return (
    <div className="flex flex-wrap gap-2">
      {ruleSchema.options.map((rule) => (
        <Badge key={rule} variant={rule === "basic" ? "default" : "neutral"}>
          {t(RULE_KEYS[rule])} · {rateOf(rule)}%
        </Badge>
      ))}
      {rules.productPercent !== null && <Badge variant="neutral">{t("payroll.detail.productRule", { percent: rules.productPercent })}</Badge>}
    </div>
  );
}

function Row({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={negative ? "tabular-nums text-status-warning" : "tabular-nums text-text-primary"}>{value}</dd>
    </div>
  );
}
