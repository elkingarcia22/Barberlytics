import * as React from "react";
import { Package, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { ListItem } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TableShell } from "@/components/data-display/TableShell";
import { EmptyState } from "@/components/feedback";
import { Field } from "@/components/forms";
import { ConfirmDialog, DrawerShell } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconTile } from "@/components/utility";
import { useAddGuest, useRemoveGuest } from "./queries";
import { APPOINTMENT_STATUS_BADGE } from "./customersUtils";
import { APPOINTMENT_SOURCE_KEYS, APPOINTMENT_STATUS_KEYS, PAYMENT_METHOD_KEYS, type CustomerDetail, type CustomerGuest } from "./types";

/**
 * Las pestañas de historial de la ficha: citas, pagos, invitados y
 * productos. Son tablas cortas y fijas dentro de la ficha, así que basta
 * `TableShell` con una `Table`.
 */

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

interface TabProps {
  customer: CustomerDetail;
  formatMoney: (value: number) => string;
}

export function CustomerAppointmentsTab({ customer, formatMoney }: TabProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  if (customer.appointments.length === 0) return <EmptyState title={t("customers.appointments.emptyTitle")} description={t("customers.appointments.emptyHint")} />;
  return (
    <TableShell title={t("customers.appointments.title")} description={t("customers.appointments.hint")}>
      <Table data-testid="customer-appointments">
        <TableHeader>
          <TableRow>
            <TableHead>{t("customers.appointments.date")}</TableHead>
            <TableHead>{t("customers.appointments.service")}</TableHead>
            <TableHead>{t("customers.appointments.barber")}</TableHead>
            <TableHead>{t("customers.appointments.source")}</TableHead>
            <TableHead>{t("customers.appointments.status")}</TableHead>
            <TableHead className="text-right">{t("customers.appointments.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customer.appointments.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap tabular-nums text-text-secondary">{formatDate(new Date(item.start), DATE_OPTIONS)}</TableCell>
              <TableCell className="font-medium text-text-primary">{item.service}</TableCell>
              <TableCell className="text-text-secondary">
                {item.barber ?? "—"}
                {item.requestedBarber && item.barber && <span className="ml-2 text-xs text-text-muted">{t("customers.appointments.requested")}</span>}
              </TableCell>
              <TableCell className="text-text-secondary">{t(APPOINTMENT_SOURCE_KEYS[item.source])}</TableCell>
              <TableCell>
                <StatusBadge status={APPOINTMENT_STATUS_BADGE[item.status]} label={t(APPOINTMENT_STATUS_KEYS[item.status])} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{item.total > 0 ? formatMoney(item.total) : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function CustomerPaymentsTab({ customer, formatMoney }: TabProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  if (customer.payments.length === 0) return <EmptyState title={t("customers.payments.emptyTitle")} description={t("customers.payments.emptyHint")} />;
  const paid = customer.payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  return (
    <TableShell title={t("customers.payments.title")} description={t("customers.payments.hint", { total: formatMoney(paid) })}>
      <Table data-testid="customer-payments">
        <TableHeader>
          <TableRow>
            <TableHead>{t("customers.appointments.date")}</TableHead>
            <TableHead>{t("customers.payments.status")}</TableHead>
            <TableHead>{t("customers.payments.method")}</TableHead>
            <TableHead>{t("customers.payments.reference")}</TableHead>
            <TableHead className="text-right">{t("customers.payments.amount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customer.payments.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap tabular-nums text-text-secondary">{formatDate(new Date(item.date), DATE_OPTIONS)}</TableCell>
              <TableCell>
                <Badge variant={item.status === "paid" ? "positive" : "warning"}>{t(item.status === "paid" ? "customers.payments.paid" : "customers.payments.refunded")}</Badge>
              </TableCell>
              <TableCell className="text-text-secondary">{t(PAYMENT_METHOD_KEYS[item.method])}</TableCell>
              <TableCell className="font-mono text-xs text-text-muted">{item.reference}</TableCell>
              <TableCell className="text-right font-medium tabular-nums text-text-primary">{formatMoney(item.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function CustomerProductsTab({ customer, formatMoney }: TabProps) {
  const t = useAppT();
  const { formatDate } = useLocale();
  if (customer.products.length === 0) return <EmptyState icon="templates" title={t("customers.products.emptyTitle")} description={t("customers.products.emptyHint")} />;
  return (
    <div className="space-y-2" data-testid="customer-products">
      {customer.products.map((item) => (
        <ListItem
          key={item.id}
          leading={<IconTile icon={<Package />} tone="neutral" />}
          title={item.name}
          description={`${t("customers.products.units", { count: item.units })} · ${t("customers.products.lastBought", { date: formatDate(new Date(item.lastBoughtAt), DATE_OPTIONS) })}`}
          meta={<span className="font-medium tabular-nums text-text-primary">{formatMoney(item.total)}</span>}
        />
      ))}
    </div>
  );
}

const MIN_GUEST_NAME = 2;

export function CustomerGuestsTab({ customer }: { customer: CustomerDetail }) {
  const t = useAppT();
  const addGuest = useAddGuest();
  const removeGuest = useRemoveGuest();
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [relation, setRelation] = React.useState("");
  const [removing, setRemoving] = React.useState<CustomerGuest | null>(null);

  const closeForm = () => {
    setAdding(false);
    setName("");
    setRelation("");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    addGuest.mutate(
      { id: customer.id, input: { name: name.trim(), relation: relation.trim() } },
      {
        onSuccess: () => {
          toast.success(t("customers.guests.added"), { description: name.trim() });
          closeForm();
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  };

  const addButton = (
    <Button variant="outline" size="sm" onClick={() => setAdding(true)} data-testid="customer-add-guest">
      <Plus /> {t("customers.guests.add")}
    </Button>
  );

  return (
    <div className="space-y-4">
      {customer.guests.length === 0 ? (
        <EmptyState icon="users" title={t("customers.guests.emptyTitle")} description={t("customers.guests.hint")} action={addButton} />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-prose text-sm text-text-secondary">{t("customers.guests.hint")}</p>
            {addButton}
          </div>
          <div className="space-y-2" data-testid="customer-guests">
            {customer.guests.map((guest) => (
              <ListItem
                key={guest.id}
                leading={<IconTile icon={<UserRound />} tone="neutral" shape="circle" />}
                title={guest.name}
                description={[guest.relation, t("customers.guests.visits", { count: guest.visits })].filter(Boolean).join(" · ")}
                actions={
                  <Button variant="ghost" size="icon-sm" aria-label={t("customers.guests.removeAria", { name: guest.name })} onClick={() => setRemoving(guest)}>
                    <Trash2 />
                  </Button>
                }
              />
            ))}
          </div>
        </>
      )}

      <DrawerShell
        open={adding}
        onOpenChange={(open) => (open ? setAdding(true) : closeForm())}
        size="md"
        title={t("customers.guests.add")}
        description={t("customers.guests.addHint", { name: customer.name })}
        actions={
          <>
            <Button type="button" variant="outline" onClick={closeForm} disabled={addGuest.isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="customer-guest-form" disabled={name.trim().length < MIN_GUEST_NAME || addGuest.isPending} data-testid="customer-guest-submit">
              {t("customers.guests.save")}
            </Button>
          </>
        }
      >
        <form id="customer-guest-form" onSubmit={submit} className="space-y-5">
          <Field label={t("customers.guests.name")} required>
            <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" data-testid="customer-guest-name" />
          </Field>
          <Field label={t("customers.guests.relation")} description={t("customers.guests.relationHint")}>
            <Input value={relation} onChange={(event) => setRelation(event.target.value)} autoComplete="off" />
          </Field>
        </form>
      </DrawerShell>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        variant="destructive"
        title={t("customers.guests.removeTitle", { name: removing?.name ?? "" })}
        description={t("customers.guests.removeHint")}
        confirmLabel={t("action.delete")}
        loading={removeGuest.isPending}
        onConfirm={() => {
          if (!removing) return;
          removeGuest.mutate(
            { id: customer.id, guestId: removing.id },
            {
              onSuccess: () => {
                toast.success(t("customers.guests.removed"), { description: removing.name });
                setRemoving(null);
              },
              onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
            }
          );
        }}
      />
    </div>
  );
}
