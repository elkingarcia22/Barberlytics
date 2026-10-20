import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, MessageCircle, Printer } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { EmptyState } from "@/components/feedback";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { branchSchema } from "@/features/settings/settingsTypes";
import { useMemberQuery } from "@/features/team/queries";
import { whatsappLink } from "@/features/customers/relationship";
import { useBrandingQuery } from "@/features/branding";
import { usePayrollQuery } from "./queries";
import { ADJUSTMENT_KIND_KEYS, PAYOUT_KEYS, type PayrollMember, type PayrollResponse } from "./types";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

/**
 * El comprobante de pago de una persona del equipo en un periodo: lo que suma, lo que resta y lo que recibe, con el
 * estado del pago. Va sin el marco de la app para imprimirse limpio: «Imprimir o guardar PDF» usa la impresión del
 * navegador, y «Enviar por WhatsApp» abre el chat con el resumen. No es nómina electrónica.
 */
export function PayslipPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const memberId = params.get("miembro") ?? "";
  const branchId = params.get("sucursal") ?? "";
  const from = params.get("desde") ?? "";
  const to = params.get("hasta") ?? "";
  const valid = Boolean(memberId && branchId && from && to);
  const query = usePayrollQuery({ branchId, from, to, memberId });

  return (
    <main className="min-h-svh bg-background p-4 sm:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft /> {t("payroll.payslip.back")}
          </Button>
        </div>
        {!valid ? (
          <EmptyState icon="error" title={t("payroll.payslip.invalid")} />
        ) : (
          <QueryBoundary query={query} loading={<Skeleton className="h-96 w-full rounded-2xl" />}>
            {(data) => {
              const member = data.members.find((item) => item.memberId === memberId);
              return member ? <Payslip data={data} member={member} branchId={branchId} /> : <EmptyState icon="error" title={t("payroll.payslip.notFound")} />;
            }}
          </QueryBoundary>
        )}
      </div>
    </main>
  );
}

function Payslip({ data, member, branchId }: { data: PayrollResponse; member: PayrollMember; branchId: string }) {
  const t = useAppT();
  const { formatDate, current } = useLocale();
  const branches = useSettingsList("branches", branchSchema);
  const branding = useBrandingQuery();
  const profile = useMemberQuery(member.memberId);
  const branch = branches.data?.items.find((item) => item.id === branchId);
  const money = (value: number) => new Intl.NumberFormat(current.intl, { style: "currency", currency: branch?.currency ?? "USD", maximumFractionDigits: branch?.currency === "COP" ? 0 : 2 }).format(value);
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);
  const period = t("payroll.payslip.period", { from: day(data.from), to: day(data.to) });
  const rent = member.payout === "rent";
  const run = data.run ?? null;

  const rows: { label: string; value: number; sign: 1 | -1 }[] = [
    ...(!rent && member.serviceCommission > 0 ? [{ label: t("payroll.column.serviceCommission"), value: member.serviceCommission, sign: 1 as const }] : []),
    ...(member.productCommission > 0 ? [{ label: t("payroll.column.productCommission"), value: member.productCommission, sign: 1 as const }] : []),
    ...(member.salary > 0 ? [{ label: t("payroll.column.salary"), value: member.salary, sign: 1 as const }] : []),
    ...(rent ? [{ label: t("payroll.rent.held"), value: member.held ?? 0, sign: 1 as const }] : member.tips > 0 ? [{ label: t("payroll.payslip.tips", { cash: money(member.tipsCash), card: money(member.tipsCard) }), value: member.tips, sign: 1 as const }] : []),
    ...(member.tipsPaidOut > 0 ? [{ label: t("payroll.detail.tipsPaidOut"), value: member.tipsPaidOut, sign: -1 as const }] : []),
    ...(member.rent > 0 ? [{ label: t("payroll.column.rent"), value: member.rent, sign: -1 as const }] : []),
    ...(member.deductions > 0 ? [{ label: t("payroll.column.deductions"), value: member.deductions, sign: -1 as const }] : []),
    ...(member.adjustments ?? []).map((item) => ({ label: [t(ADJUSTMENT_KIND_KEYS[item.kind]), item.note].filter(Boolean).join(" · "), value: item.amount, sign: item.kind === "bonus" ? (1 as const) : (-1 as const) })),
  ];
  const status = run?.status === "paid" ? t("payroll.payslip.paid", { date: run.paidAt ? formatDate(new Date(run.paidAt), DAY) : "" }) : run?.status === "approved" ? t("payroll.payslip.approved") : t("payroll.payslip.draft");
  const summary = t("payroll.payslip.whatsapp", { name: member.name.split(" ")[0] ?? member.name, period, amount: money(Math.abs(member.net)), status });
  const phone = profile.data?.phone ?? "";

  return (
    <>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={() => window.print()} data-testid="payslip-print">
          <Printer /> {t("payroll.payslip.print")}
        </Button>
        <Button variant="outline" disabled={!phone} onClick={() => window.open(whatsappLink(phone, summary), "_blank", "noopener,noreferrer")} data-testid="payslip-whatsapp">
          <MessageCircle /> {t("payroll.payslip.send")}
        </Button>
      </div>
      <article className="space-y-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8 print:rounded-none print:border-0 print:shadow-none" data-testid="payslip">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <Text size="sm" tone="muted">
              {[branding.data?.name, branch?.name].filter(Boolean).join(" · ")}
            </Text>
            <Heading level={3} as="h1">
              {t("payroll.payslip.title")}
            </Heading>
            <Text tone="muted">{period}</Text>
          </div>
          <div className="sm:text-right">
            <Text weight="semibold">{member.name}</Text>
            <Text size="sm" tone="muted">
              {t(PAYOUT_KEYS[member.payout])} · {t("payroll.payslip.services", { count: member.services })}
            </Text>
            {branch?.legalName && (
              <Text size="xs" tone="muted">
                {[branch.legalName, branch.taxId].filter(Boolean).join(" · ")}
              </Text>
            )}
          </div>
        </header>

        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border/40">
                <td className="py-2 pr-4 text-text-secondary">{row.label}</td>
                <td className={`py-2 text-right tabular-nums ${row.sign < 0 ? "text-status-negative" : "text-text-primary"}`}>
                  {row.sign < 0 ? "−" : "+"}
                  {money(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 font-semibold text-text-primary">{member.net < 0 ? t("payroll.detail.owes") : t("payroll.detail.toPay")}</td>
              <td className="pt-3 text-right text-xl font-semibold tabular-nums" data-testid="payslip-net">
                {money(Math.abs(member.net))}
              </td>
            </tr>
          </tfoot>
        </table>

        <footer className="space-y-1 border-t border-border/60 pt-4">
          <Text size="sm" data-testid="payslip-status">
            {status}
            {run?.status === "paid" && run.method ? ` · ${run.method}` : ""}
          </Text>
          <Text size="xs" tone="muted">
            {t("payroll.payslip.note")}
          </Text>
        </footer>
      </article>
    </>
  );
}
