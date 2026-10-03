import { CreditCard, Download } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Field } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { SettingsCard, SettingsDocument, type FieldErrors } from "../SettingsFormParts";
import { billingSchema, type BillingSettings as Billing } from "../settingsTypes";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const asDate = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Plan y facturación: qué plan tiene la barbería, a nombre de quién salen
 * las facturas, con qué tarjeta se paga y las facturas anteriores. Solo se
 * editan los datos de facturación; el plan y la tarjeta se cambian con
 * soporte, y de la tarjeta solo se enseñan los cuatro últimos dígitos.
 */
export function BillingSettings() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const formatMoney = useMoney();

  const validate = (draft: Billing): FieldErrors => {
    const errors: FieldErrors = {};
    if (draft.details.name.trim().length < 2) errors.name = t("cfg.billing.error.name");
    if (!EMAIL.test(draft.details.email.trim())) errors.email = t("cfg.billing.error.email");
    return errors;
  };

  return (
    <SettingsDocument section="billing" schema={billingSchema} validate={validate} toBody={(draft) => ({ details: draft.details })}>
      {({ draft, set, errors }) => {
        const setDetail = (key: keyof Billing["details"], value: string) => set("details", { ...draft.details, [key]: value });
        return (
          <>
            <SettingsCard title={t("cfg.billing.plan")}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xl font-semibold text-text-primary">
                    {draft.plan.name}
                    <Badge variant="neutral">{t(draft.plan.cycle === "annual" ? "cfg.billing.annual" : "cfg.billing.monthly")}</Badge>
                  </p>
                  <Text variant="muted">{t("cfg.billing.nextInvoice", { date: formatDate(asDate(draft.plan.nextInvoiceAt), DATE_OPTIONS) })}</Text>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-text-primary">{formatMoney(draft.plan.price)}</p>
              </div>
            </SettingsCard>

            <SettingsCard title={t("cfg.billing.details")} description={t("cfg.billing.detailsHint")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("cfg.billing.name")} required error={errors.name}>
                  <Input value={draft.details.name} onChange={(event) => setDetail("name", event.target.value)} aria-invalid={!!errors.name} autoComplete="off" data-testid="billing-name" />
                </Field>
                <Field label={t("cfg.billing.email")} required error={errors.email} description={t("cfg.billing.emailHint")}>
                  <Input type="email" value={draft.details.email} onChange={(event) => setDetail("email", event.target.value)} aria-invalid={!!errors.email} autoComplete="off" data-testid="billing-email" />
                </Field>
                <Field label={t("cfg.branches.address")}>
                  <Input value={draft.details.address} onChange={(event) => setDetail("address", event.target.value)} autoComplete="off" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("cfg.branches.city")}>
                    <Input value={draft.details.city} onChange={(event) => setDetail("city", event.target.value)} autoComplete="off" />
                  </Field>
                  <Field label={t("cfg.branches.state")}>
                    <Input value={draft.details.state} onChange={(event) => setDetail("state", event.target.value)} autoComplete="off" />
                  </Field>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title={t("cfg.billing.method")} description={t("cfg.billing.methodHint")}>
              <div className="flex items-center gap-3">
                <IconTile icon={<CreditCard />} tone="neutral" />
                <div>
                  <p className="text-sm font-medium capitalize text-text-primary">{draft.method.brand}</p>
                  <p className="font-mono text-xs text-text-muted">•••• •••• •••• {draft.method.last4}</p>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title={t("cfg.billing.invoices")} description={t("cfg.billing.invoicesCount", { count: draft.invoices.length })}>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <Table data-testid="billing-invoices">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cfg.billing.date")}</TableHead>
                      <TableHead>{t("cfg.billing.concept")}</TableHead>
                      <TableHead className="text-right">{t("cfg.billing.total")}</TableHead>
                      <TableHead className="w-12 text-right">
                        <span className="sr-only">{t("cfg.billing.download")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draft.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="whitespace-nowrap tabular-nums text-text-secondary">{formatDate(asDate(invoice.date), DATE_OPTIONS)}</TableCell>
                        <TableCell className="text-text-primary">{invoice.concept}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(invoice.total)}</TableCell>
                        <TableCell className="text-right">
                          {/* El mock no tiene los PDF: el botón avisa en vez de descargar un archivo vacío. */}
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("cfg.billing.downloadAria", { concept: invoice.concept })} onClick={() => toast.info(t("cfg.billing.downloadSoon"))}>
                            <Download />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SettingsCard>
          </>
        );
      }}
    </SettingsDocument>
  );
}
