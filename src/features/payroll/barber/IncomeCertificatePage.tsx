import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { QueryBoundary } from "@/lib/query";
import { EmptyState } from "@/components/feedback";
import { SegmentedControl } from "@/components/selection";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandingQuery } from "@/features/branding";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { branchSchema } from "@/features/settings/settingsTypes";
import { useIncomeCertificate, type IncomeCertificate } from "../barberPay";
import { PAYOUT_KEYS } from "../types";

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const MONTH: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
type Preset = "thisYear" | "lastYear" | "last12";
const PRESETS: readonly { id: Preset; key: AppMessageKey }[] = [
  { id: "thisYear", key: "payroll.certificate.thisYear" },
  { id: "lastYear", key: "payroll.certificate.lastYear" },
  { id: "last12", key: "payroll.certificate.last12" },
];

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** El rango de cada atajo, contado desde hoy. */
function rangeOf(preset: Preset, today = new Date()): { from: string; to: string } {
  const year = today.getFullYear();
  if (preset === "lastYear") return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  if (preset === "last12") return { from: iso(new Date(year - 1, today.getMonth(), today.getDate() + 1)), to: iso(today) };
  return { from: `${year}-01-01`, to: iso(today) };
}

/**
 * El certificado de ingresos de una persona del equipo en un rango (hasta un año), mes por mes: para su contador, para
 * arrendar o pedir un crédito. Sin el marco de la app para imprimirse limpio; también se baja en CSV. No reemplaza los
 * certificados oficiales de cada país.
 */
export function IncomeCertificatePage() {
  const t = useAppT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const preset = (PRESETS.find((item) => item.id === params.get("rango"))?.id ?? "thisYear") as Preset;
  const range = rangeOf(preset);
  const branchId = params.get("sucursal") ?? "";
  const memberId = params.get("miembro");
  const query = useIncomeCertificate({ branchId, memberId, ...range });

  return (
    <main className="min-h-svh bg-background p-4 sm:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft /> {t("payroll.payslip.back")}
          </Button>
          <SegmentedControl
            size="sm"
            value={preset}
            onChange={(value) =>
              setParams(
                (current) => {
                  const next = new URLSearchParams(current);
                  next.set("rango", value);
                  return next;
                },
                { replace: true }
              )
            }
            options={PRESETS.map((item) => ({ value: item.id, label: t(item.key) }))}
            ariaLabel={t("payroll.certificate.range")}
          />
        </div>
        {!branchId ? (
          <EmptyState icon="error" title={t("payroll.payslip.invalid")} />
        ) : (
          <QueryBoundary query={query} loading={<Skeleton className="h-96 w-full rounded-2xl" />}>
            {(data) => <Certificate data={data} branchId={branchId} />}
          </QueryBoundary>
        )}
      </div>
    </main>
  );
}

function Certificate({ data, branchId }: { data: IncomeCertificate; branchId: string }) {
  const t = useAppT();
  const { formatDate, current } = useLocale();
  const branches = useSettingsList("branches", branchSchema);
  const branding = useBrandingQuery();
  const branch = branches.data?.items.find((item) => item.id === branchId);
  const currency = branch?.currency ?? "USD";
  const money = (value: number) => new Intl.NumberFormat(current.intl, { style: "currency", currency, maximumFractionDigits: currency === "COP" ? 0 : 2 }).format(value);
  const day = (value: string) => formatDate(new Date(`${value}T12:00:00`), DAY);
  const rent = data.payout === "rent";
  const month = (value: string) => {
    const label = formatDate(new Date(`${value}-15T12:00:00`), MONTH);
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const downloadCsv = () => {
    const header = [t("payroll.certificate.month"), t("payroll.certificate.services"), t(rent ? "payroll.certificate.salesRent" : "payroll.certificate.salesPay"), t("payroll.column.tips"), ...(rent ? [t("payroll.certificate.costs")] : [t("payroll.column.adjustments")]), t("payroll.certificate.earned")];
    const lines = data.rows.map((row) => [row.month, row.services, row.sales, row.tips, rent ? row.costs : row.adjustments, row.earned]);
    const csv = [header, ...lines, [t("payroll.certificate.total"), data.totals.services, data.totals.sales, data.totals.tips, rent ? data.totals.costs : data.totals.adjustments, data.totals.earned]].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificado-${data.name.toLowerCase().replace(/\s+/g, "-")}-${data.from}-${data.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={() => window.print()} data-testid="certificate-print">
          <Printer /> {t("payroll.payslip.print")}
        </Button>
        <Button variant="outline" onClick={downloadCsv} data-testid="certificate-csv">
          <Download /> {t("payroll.certificate.csv")}
        </Button>
      </div>
      <article className="space-y-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8 print:rounded-none print:border-0 print:shadow-none" data-testid="income-certificate">
        <header className="space-y-1 border-b border-border/60 pb-4">
          <Text size="sm" tone="muted">
            {[branding.data?.name, branch?.legalName, branch?.taxId].filter(Boolean).join(" · ")}
          </Text>
          <Heading level={3} as="h1">
            {t("payroll.certificate.title")}
          </Heading>
          <Text>{t(rent ? "payroll.certificate.statementRent" : "payroll.certificate.statementPay", { name: data.name, payout: t(PAYOUT_KEYS[data.payout]).toLowerCase(), from: day(data.from), to: day(data.to), total: money(data.totals.earned) })}</Text>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-text-muted">
                <th className="py-2 pr-3 font-medium">{t("payroll.certificate.month")}</th>
                <th className="py-2 pr-3 text-right font-medium">{t("payroll.certificate.services")}</th>
                <th className="py-2 pr-3 text-right font-medium">{t(rent ? "payroll.certificate.salesRent" : "payroll.certificate.salesPay")}</th>
                <th className="py-2 pr-3 text-right font-medium">{t("payroll.column.tips")}</th>
                <th className="py-2 pr-3 text-right font-medium">{t(rent ? "payroll.certificate.costs" : "payroll.column.adjustments")}</th>
                <th className="py-2 text-right font-medium">{t("payroll.certificate.earned")}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.month} className="border-b border-border/40">
                  <td className="py-2 pr-3">{month(row.month)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{row.services}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(row.sales)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(row.tips)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{rent ? `−${money(row.costs)}` : money(row.adjustments)}</td>
                  <td className="py-2 text-right font-medium tabular-nums">{money(row.earned)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="pt-3">{t("payroll.certificate.total")}</td>
                <td className="pt-3 text-right tabular-nums">{data.totals.services}</td>
                <td className="pt-3 text-right tabular-nums">{money(data.totals.sales)}</td>
                <td className="pt-3 text-right tabular-nums">{money(data.totals.tips)}</td>
                <td className="pt-3 text-right tabular-nums">{rent ? `−${money(data.totals.costs)}` : money(data.totals.adjustments)}</td>
                <td className="pt-3 text-right text-base tabular-nums" data-testid="certificate-total">
                  {money(data.totals.earned)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <footer className="space-y-1 border-t border-border/60 pt-4">
          <Text size="xs" tone="muted">
            {t(rent ? "payroll.certificate.howRent" : "payroll.certificate.howPay")}
          </Text>
          <Text size="xs" tone="muted">
            {t("payroll.certificate.note", { date: formatDate(new Date(data.generatedAt), DAY) })}
          </Text>
        </footer>
      </article>
    </>
  );
}
