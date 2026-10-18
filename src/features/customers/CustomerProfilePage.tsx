import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Ban, CalendarPlus, MessageCircle, NotebookPen, Pencil, ShieldCheck, Trash2 } from "lucide-react";
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
import { useCustomerPermissions } from "./customerAccess";
import { CustomerFormDrawer } from "./CustomerFormDrawer";
import { CustomerAppointmentsTab, CustomerGuestsTab, CustomerPaymentsTab, CustomerProductsTab } from "./CustomerHistoryTabs";
import { CustomerNoteDrawer } from "./CustomerNoteDrawer";
import { CustomerWhatsAppDialog } from "./CustomerWhatsAppDialog";
import { CustomerOverview } from "./CustomerOverview";
import { CustomerAvatar, SegmentBadge } from "./customersShared";
import { branchName, maskPhone } from "./customersUtils";
import { useCustomerQuery, useDeleteCustomer, useSetCustomerBlocked } from "./queries";
import type { CustomerDetail } from "./types";

/**
 * La ficha de un cliente. La cabecera dice quién es y en qué momento está;
 * el resumen junta lo que antes estaba repartido entre «Información general»
 * y «Perfil», y el historial —citas, pagos, invitados, productos— va en sus
 * pestañas. La pestaña vive en la URL.
 *
 * Según el rol (`customerAccess.ts`): un barbero solo abre la ficha de sus
 * clientes; sin «Información del cliente» no hay contacto ni notas médicas;
 * recepción no ve cifras de dinero (ni la pestaña de pagos), y editar,
 * bloquear y borrar salen de la matriz.
 */

const TABS = ["resumen", "citas", "pagos", "invitados", "productos"] as const;
/** Sin cifras de dinero, los pagos del cliente no tienen nada que enseñar. */
const MONEY_TABS: readonly string[] = ["pagos"];
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
        {(data) => <CustomerProfileGate customer={data} />}
      </QueryBoundary>
    </div>
  );
}

/**
 * Un barbero que abre por enlace la ficha de un cliente que no es suyo ve
 * «sin permiso», no la ficha. El recorte de verdad es del servidor (el
 * contrato aún no recibe el rol); aquí se respeta el mismo criterio.
 */
function CustomerProfileGate({ customer }: { customer: CustomerDetail }) {
  const t = useAppT();
  const navigate = useNavigate();
  const perms = useCustomerPermissions();
  if (!perms.canSee(customer)) {
    return (
      <EmptyState
        icon="lock"
        title={t("customers.profile.forbiddenTitle")}
        description={t("customers.profile.forbiddenHint")}
        data-testid="customer-forbidden"
        action={
          <Button variant="outline" onClick={() => navigate("/clientes")}>
            <ArrowLeft /> {t("customers.profile.back")}
          </Button>
        }
      />
    );
  }
  return <CustomerProfile customer={customer} />;
}

function CustomerProfile({ customer }: { customer: CustomerDetail }) {
  const t = useAppT();
  const navigate = useNavigate();
  const formatMoney = useMoney();
  const perms = useCustomerPermissions();
  const deleteCustomer = useDeleteCustomer();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const setBlocked = useSetCustomerBlocked();
  const [drawer, setDrawer] = React.useState<"edit" | "note" | "whatsapp" | null>(null);
  const [confirmBlock, setConfirmBlock] = React.useState(false);

  const tabParam = searchParams.get("pestana");
  const visibleTabs = TABS.filter((item) => perms.showMoney || !MONEY_TABS.includes(item));
  const tab: ProfileTab = visibleTabs.find((item) => item === tabParam) ?? "resumen";
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

  const actions = React.useMemo<readonly RailActionSpec[]>(() => {
    const list: (RailActionSpec | false)[] = [
      perms.showContact && Boolean(customer.phone) && { id: "whatsapp", label: t("customers.action.whatsapp"), icon: <MessageCircle className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer("whatsapp") },
      { id: "note", label: t("customers.action.note"), icon: <NotebookPen className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer("note") },
      perms.canEdit && { id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer("edit") },
      perms.canEdit &&
        (customer.blocked
          ? { id: "unblock", label: t("customers.action.unblock"), icon: <ShieldCheck className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setConfirmBlock(true) }
          : { id: "block", label: t("customers.action.block"), icon: <Ban className="size-5" strokeWidth={2} />, scope: ["screen"], tone: "danger", overflow: true, onSelect: () => setConfirmBlock(true) }),
      perms.canDelete && { id: "delete", label: t("customers.action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["screen"], tone: "danger", overflow: true, onSelect: () => setConfirmDelete(true) },
      { id: "book", label: t("customers.action.book"), icon: <CalendarPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, blockedReason: customer.blocked ? t("customers.action.bookBlocked") : null, onSelect: () => navigate(`/calendario?cliente=${customer.id}`) },
    ];
    return list.filter((action): action is RailActionSpec => action !== false);
  }, [customer.blocked, customer.id, customer.phone, navigate, perms.canDelete, perms.canEdit, perms.showContact, t]);

  const tabs = visibleTabs.map((item) => ({
    id: item,
    label: t(TAB_KEYS[item]),
    badge: item === "citas" ? customer.appointments.length : item === "invitados" ? customer.guests.length : undefined,
  }));

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} size="lg" />
            <span className="flex flex-wrap items-center gap-2">
              {customer.name}
              <SegmentBadge segment={customer.segment} />
            </span>
          </span>
        }
        description={perms.showContact ? `${maskPhone(customer.phone)} · ${customer.email}` : branchName(customer.branchId)}
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

      {tab === "resumen" && <CustomerOverview customer={customer} formatMoney={formatMoney} onAddNote={() => setDrawer("note")} onEdit={perms.canEdit ? () => setDrawer("edit") : undefined} onSeeAppointments={() => setTab("citas")} showContact={perms.showContact} showMoney={perms.showMoney} />}
      {tab === "citas" && <CustomerAppointmentsTab customer={customer} formatMoney={formatMoney} showMoney={perms.showMoney} ownAmountsOf={perms.scope === "own" ? perms.memberId : null} />}
      {tab === "pagos" && <CustomerPaymentsTab customer={customer} formatMoney={formatMoney} />}
      {tab === "invitados" && <CustomerGuestsTab customer={customer} />}
      {tab === "productos" && <CustomerProductsTab customer={customer} formatMoney={formatMoney} showMoney={perms.showMoney} />}

      <ShellRailSlot>
        <DataListActionRail actions={actions} selectedCount={0} onClearSelection={() => undefined} isBlocked={drawer !== null || confirmBlock || confirmDelete} />
      </ShellRailSlot>

      {perms.canEdit && <CustomerFormDrawer open={drawer === "edit"} onOpenChange={(open) => !open && setDrawer(null)} customer={customer} branchId={customer.branchId} />}
      {drawer === "whatsapp" && <CustomerWhatsAppDialog open onOpenChange={(open) => !open && setDrawer(null)} customer={customer} />}
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title={t("customers.delete.title", { name: customer.name })}
        description={t("customers.delete.hint")}
        confirmLabel={t("customers.action.delete")}
        loading={deleteCustomer.isPending}
        onConfirm={() =>
          deleteCustomer.mutate(customer.id, {
            onSuccess: () => {
              toast.success(t("customers.delete.done"), { description: customer.name });
              navigate("/clientes");
            },
            onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
          })
        }
      />
    </>
  );
}
