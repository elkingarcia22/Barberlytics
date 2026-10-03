import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Ban, CalendarPlus, NotebookPen, Pencil, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { CustomerFormDrawer } from "./CustomerFormDrawer";
import { CustomerAppointmentsTab, CustomerGuestsTab, CustomerPaymentsTab, CustomerProductsTab } from "./CustomerHistoryTabs";
import { CustomerNoteDrawer } from "./CustomerNoteDrawer";
import { CustomerOverview } from "./CustomerOverview";
import { CustomerAvatar, SegmentBadge } from "./customersShared";
import { maskPhone } from "./customersUtils";
import { useCustomerQuery, useSetCustomerBlocked } from "./queries";
import type { CustomerDetail } from "./types";

/**
 * La ficha de un cliente. La cabecera dice quién es y en qué momento está;
 * el resumen junta lo que antes estaba repartido entre «Información general»
 * y «Perfil», y el historial —citas, pagos, invitados, productos— va en sus
 * pestañas. La pestaña vive en la URL.
 */

const TABS = ["resumen", "citas", "pagos", "invitados", "productos"] as const;
type ProfileTab = (typeof TABS)[number];

const TAB_KEYS: Readonly<Record<ProfileTab, AppMessageKey>> = {
  resumen: "customers.tab.overview",
  citas: "customers.tab.appointments",
  pagos: "customers.tab.payments",
  invitados: "customers.tab.guests",
  productos: "customers.tab.products",
};

export function CustomerProfilePage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const customer = useCustomerQuery(id);

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("customers.title"), onClick: () => navigate("/clientes") }, customer.data?.name ?? t("customers.profile.title")]} />
      </ShellHeaderSlot>

      <QueryBoundary
        query={customer}
        loading={
          <div className="space-y-4" data-testid="customer-loading">
            <Skeleton className="h-20 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
        error={(error, retry) => (
          <EmptyState
            title={t("customers.profile.notFound")}
            description={`${t("customers.profile.notFoundHint")} ${describeError(error).description}`}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/clientes")}>
                  <ArrowLeft /> {t("customers.profile.back")}
                </Button>
                <Button onClick={retry}>{t("common.retry")}</Button>
              </div>
            }
          />
        )}
      >
        {(data) => <CustomerProfile customer={data} />}
      </QueryBoundary>
    </div>
  );
}

function CustomerProfile({ customer }: { customer: CustomerDetail }) {
  const t = useAppT();
  const navigate = useNavigate();
  const formatMoney = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const setBlocked = useSetCustomerBlocked();
  const [drawer, setDrawer] = React.useState<"edit" | "note" | null>(null);
  const [confirmBlock, setConfirmBlock] = React.useState(false);

  const tabParam = searchParams.get("pestana");
  const tab: ProfileTab = TABS.find((item) => item === tabParam) ?? "resumen";
  const setTab = (next: ProfileTab) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === "resumen") params.delete("pestana");
        else params.set("pestana", next);
        return params;
      },
      { replace: true }
    );

  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => [
      { id: "note", label: t("customers.action.note"), icon: <NotebookPen className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer("note") },
      { id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer("edit") },
      customer.blocked
        ? { id: "unblock", label: t("customers.action.unblock"), icon: <ShieldCheck className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setConfirmBlock(true) }
        : { id: "block", label: t("customers.action.block"), icon: <Ban className="size-5" strokeWidth={2} />, scope: ["screen"], tone: "danger", overflow: true, onSelect: () => setConfirmBlock(true) },
      { id: "book", label: t("customers.action.book"), icon: <CalendarPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, blockedReason: customer.blocked ? t("customers.action.bookBlocked") : null, onSelect: () => navigate(`/calendario?cliente=${customer.id}`) },
    ],
    [customer.blocked, customer.id, navigate, t]
  );

  const tabs = TABS.map((item) => ({
    id: item,
    label: t(TAB_KEYS[item]),
    badge: item === "citas" ? customer.appointments.length : item === "invitados" ? customer.guests.length : undefined,
  }));

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <CustomerAvatar name={customer.name} size="lg" />
            <span className="flex flex-wrap items-center gap-2">
              {customer.name}
              <SegmentBadge segment={customer.segment} />
            </span>
          </span>
        }
        description={`${maskPhone(customer.phone)} · ${customer.email}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/clientes")}>
            <ArrowLeft /> {t("customers.profile.back")}
          </Button>
        }
      />

      {customer.blocked && (
        <Alert variant="destructive" data-testid="customer-blocked">
          <Ban />
          <AlertTitle>{t("customers.profile.blockedTitle")}</AlertTitle>
          <AlertDescription>{t("customers.profile.blockedHint")}</AlertDescription>
        </Alert>
      )}

      <ThemaTabs className="mb-4" variant="page" fitContent tabs={tabs} activeTabId={tab} onTabChange={(next) => setTab(next as ProfileTab)} />

      {tab === "resumen" && <CustomerOverview customer={customer} formatMoney={formatMoney} onAddNote={() => setDrawer("note")} onEdit={() => setDrawer("edit")} onSeeAppointments={() => setTab("citas")} />}
      {tab === "citas" && <CustomerAppointmentsTab customer={customer} formatMoney={formatMoney} />}
      {tab === "pagos" && <CustomerPaymentsTab customer={customer} formatMoney={formatMoney} />}
      {tab === "invitados" && <CustomerGuestsTab customer={customer} />}
      {tab === "productos" && <CustomerProductsTab customer={customer} formatMoney={formatMoney} />}

      <ShellRailSlot>
        <DataListActionRail actions={actions} selectedCount={0} onClearSelection={() => undefined} isBlocked={drawer !== null || confirmBlock} />
      </ShellRailSlot>

      <CustomerFormDrawer open={drawer === "edit"} onOpenChange={(open) => !open && setDrawer(null)} customer={customer} branchId={customer.branchId} />
      <CustomerNoteDrawer open={drawer === "note"} onOpenChange={(open) => !open && setDrawer(null)} customerId={customer.id} customerName={customer.name} />

      <ConfirmDialog
        open={confirmBlock}
        onOpenChange={setConfirmBlock}
        variant={customer.blocked ? "default" : "destructive"}
        title={t(customer.blocked ? "customers.unblock.title" : "customers.block.title", { name: customer.name })}
        description={t(customer.blocked ? "customers.unblock.hint" : "customers.block.hint")}
        confirmLabel={t(customer.blocked ? "customers.action.unblock" : "customers.action.block")}
        loading={setBlocked.isPending}
        onConfirm={() => {
          const blocking = !customer.blocked;
          setBlocked.mutate(
            { id: customer.id, blocked: blocking },
            {
              onSuccess: () => {
                toast.success(t(blocking ? "customers.block.done" : "customers.unblock.done"), { description: customer.name });
                setConfirmBlock(false);
              },
              onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
            }
          );
        }}
      />
    </>
  );
}
