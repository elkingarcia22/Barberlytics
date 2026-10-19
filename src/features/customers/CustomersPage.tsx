import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, TriangleAlert, UserPlus, Users, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail } from "@/components/action-rail";
import { DataListBlock } from "@/components/blocks";
import { MetricCard, MetricDial, MetricRing, getChartTheme } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { AttentionAction, AttentionStrip, EmptyState } from "@/components/feedback";
import { Breadcrumbs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { OptionTile } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { CustomerFormDrawer } from "./CustomerFormDrawer";
import { CustomerImportDrawer } from "./CustomerImportDrawer";
import { ReactivationDrawer } from "./ReactivationDrawer";
import { PrivacyRequestsDrawer } from "./PrivacyRequestsDrawer";
import { useAccess } from "@/features/access";
import { CustomerNoteDrawer } from "./CustomerNoteDrawer";
import { useCustomerPermissions } from "./customerAccess";
import { customerListActions } from "./customerActions";
import { ALL_SEGMENTS, BIRTHDAY_WINDOW_DAYS, CUSTOMER_ALERTS, UNRELIABLE_MISSES, countBySegment, customerCells, customerColumns, customersCsvRows, customerPulse, parseSegment, type CustomerAlertId } from "./customersHome";
import { CustomerAvatar, SegmentBadge } from "./customersShared";
import { SEGMENT_STYLE, branchName, downloadCsv, formatAgo, maskPhone } from "./customersUtils";
import { useCustomersQuery, useDeleteCustomer, useSetCustomerBlocked } from "./queries";
import { SEGMENT_HINT_KEYS, SEGMENT_KEYS, customerSegmentSchema, type Customer } from "./types";

const PAGE_SIZE = 10;
/* En el móvil los segmentos son una fila que se desliza; desde `sm`, una rejilla con todos a la vista. */
const TILE_CLASS = "w-44 shrink-0 sm:w-auto";
const ringColor = getChartTheme().color[0];
const ALERT_IDS: readonly string[] = CUSTOMER_ALERTS.map((alert) => alert.id);

/**
 * La lista de clientes.
 *
 * El mismo molde que el home de equipo: arriba, en qué momento de la
 * relación está cada quien —con su recuento y lo que significa a la vista,
 * no escondido tras nueve pestañas—; después cómo va la base, quién necesita
 * algo hoy y la lista con todo. El segmento y el aviso viven en la URL: el
 * enlace reproduce la misma vista.
 *
 * Cambia según el rol (`customerAccess.ts`): el barbero ve solo sus
 * clientes; sin «Información del cliente» no hay teléfono, correo ni notas
 * médicas; recepción no ve cifras de dinero, y cada acción sale de la matriz.
 */
export function CustomersPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const query = useCustomersQuery();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("customers.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("customers.title")} description={t("customers.description")} />

      <QueryBoundary
        query={query}
        loading={
          <div className="space-y-section" data-testid="customers-loading">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="grid gap-stack lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[168px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        }
      >
        {(data) => <CustomersHome allRows={data.items} />}
      </QueryBoundary>
    </div>
  );
}

function CustomersHome({ allRows }: { allRows: readonly Customer[] }) {
  const t = useAppT();
  const perms = useCustomerPermissions();
  /* El barbero ve solo sus clientes: los segmentos, el pulso y los avisos se cuentan sobre ellos. */
  const rows = React.useMemo(() => allRows.filter(perms.canSee), [allRows, perms]);
  const navigate = useNavigate();
  const branchId = useBranchId();
  const { formatNumber, formatDate, formatRelativeTime } = useLocale();
  const formatMoney = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const setBlocked = useSetCustomerBlocked();
  const deleteCustomer = useDeleteCustomer();

  const segment = parseSegment(searchParams.get("tipo"));
  const alertParam = searchParams.get("aviso");
  const alert = ALERT_IDS.includes(alertParam ?? "") ? (alertParam as CustomerAlertId) : null;
  const setFilters = (next: { tipo?: string | null; aviso?: string | null }) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        for (const [key, value] of Object.entries(next)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
        return params;
      },
      { replace: true }
    );

  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [drawer, setDrawer] = React.useState<"create" | "note" | null>(null);
  const [confirmBlock, setConfirmBlock] = React.useState<Customer | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [reactivating, setReactivating] = React.useState(false);
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  // Reactivar escribe a clientes en nombre de la barbería: lo aprueba quien gestiona.
  const access = useAccess();
  const manages = access.role === "owner" || access.role === "admin";
  const [confirmDelete, setConfirmDelete] = React.useState<Customer | null>(null);
  const [actionsPlacement, setActionsPlacement] = React.useState<TableActionsPlacement>("rail");
  const railOwnsActions = actionsPlacement === "rail";

  const formatCount = React.useCallback((value: number) => formatNumber(value), [formatNumber]);
  const formatPercent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
  const { showContact, showMoney } = perms;
  const columns = React.useMemo(() => customerColumns(t, { showMoney, showContact, showBarber: perms.scope === "all" }), [t, showMoney, showContact, perms.scope]);
  const cells = React.useMemo(() => customerCells(t, { formatCount, formatMoney, formatDate, formatRelativeTime }, { showContact }), [t, formatCount, formatMoney, formatDate, formatRelativeTime, showContact]);

  const counts = React.useMemo(() => countBySegment(rows), [rows]);
  const pool = React.useMemo(() => (segment === ALL_SEGMENTS ? rows : rows.filter((row) => row.segment === segment)), [rows, segment]);
  const pulse = React.useMemo(() => customerPulse(pool), [pool]);
  const preset = CUSTOMER_ALERTS.find((item) => item.id === alert);
  const filtered = React.useMemo(() => pool.filter((row) => !preset || preset.matches(row)), [pool, preset]);
  const attention = pool.filter((row) => CUSTOMER_ALERTS.some((item) => item.matches(row))).length;
  const calm = attention === 0;

  const single = selected.size === 1 ? rows.find((row) => row.id === [...selected][0]) : undefined;
  /* Se descarga lo que se ve: el mismo recorte por rol y los mismos filtros de la pantalla. */
  const exportList = React.useCallback(() => {
    const csv = customersCsvRows(t, filtered, { showContact, showMoney });
    downloadCsv(`clientes-${new Date().toISOString().slice(0, 10)}.csv`, csv.header, csv.rows);
    toast.success(t("customers.export.done"), { description: t("customers.export.doneHint", { count: csv.rows.length }) });
  }, [filtered, showContact, showMoney, t]);
  const actions = React.useMemo(
    () =>
      customerListActions(
        t,
        {
          create: () => setDrawer("create"),
          exportList,
          importList: () => setImporting(true),
          reactivate: manages ? () => setReactivating(true) : undefined,
          privacyRequests: perms.canLogPrivacy ? () => setPrivacyOpen(true) : undefined,
          open: () => single && navigate(`/clientes/${single.id}`),
          book: () => single && navigate(`/calendario?cliente=${single.id}`),
          note: () => single && setDrawer("note"),
          block: () => single && setConfirmBlock(single),
          remove: () => single && setConfirmDelete(single),
        },
        single?.blocked ?? false,
        perms
      ),
    [exportList, manages, navigate, perms, single, t]
  );

  /* Cambiar de segmento con un aviso puesto puede dejar la lista en blanco
     —«en riesgo» no le pasa a un cliente nuevo—, así que elegirlo suelta el aviso. */
  const pickSegment = (value: string) => {
    setFilters({ tipo: value === ALL_SEGMENTS ? null : value, aviso: null });
    setSelected(new Set());
  };
  const pickAlert = (id: CustomerAlertId) => setFilters({ aviso: alert === id ? null : id });

  const segmentHint = segment === ALL_SEGMENTS ? t("customers.segment.allHint") : t(SEGMENT_HINT_KEYS[segment]);
  const hasFilter = segment !== ALL_SEGMENTS || alert !== null;

  if (rows.length === 0) {
    return (
      <>
        <EmptyState
          icon="users"
          title={t("customers.emptyTitle")}
          description={t("customers.emptyHint")}
          action={
            perms.canCreate ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setDrawer("create")}>
                  <UserPlus /> {t("customers.action.create")}
                </Button>
                {perms.canImport && (
                  <Button variant="outline" onClick={() => setImporting(true)}>
                    <Upload /> {t("customers.action.import")}
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
        <CustomerFormDrawer open={drawer === "create"} onOpenChange={(open) => !open && setDrawer(null)} branchId={branchId} onCreated={(customer) => navigate(`/clientes/${customer.id}`)} />
      <CustomerImportDrawer open={importing} onOpenChange={setImporting} branchId={branchId} />
      <ReactivationDrawer open={reactivating} onOpenChange={setReactivating} branchId={branchId} />
      {perms.canLogPrivacy && <PrivacyRequestsDrawer open={privacyOpen} onOpenChange={setPrivacyOpen} canClose={perms.canManagePrivacy} />}
      </>
    );
  }

  return (
    <>
      <section aria-label={t("customers.segmentsAria")} className="mb-section shrink-0">
        <div className="mb-stack flex items-baseline gap-2">
          <h2 className="shrink-0 text-sm font-semibold text-text-secondary">{t("customers.segments")}</h2>
          <p className="min-w-0 truncate text-xs text-text-muted" data-testid="customers-segment-hint">
            {segmentHint}
          </p>
        </div>
        <div role="radiogroup" aria-label={t("customers.segmentsAria")} className="-mx-1 flex gap-stack overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:p-0 xl:grid-cols-5">
          <OptionTile compact className={TILE_CLASS} option={{ value: ALL_SEGMENTS, label: t("customers.segment.all"), badge: formatCount(rows.length), icon: Users }} selected={segment === ALL_SEGMENTS} onSelect={pickSegment} />
          {customerSegmentSchema.options.map((id) => (
            <OptionTile key={id} compact className={TILE_CLASS} option={{ value: id, label: t(SEGMENT_KEYS[id]), badge: formatCount(counts[id]), icon: SEGMENT_STYLE[id].icon }} selected={segment === id} onSelect={pickSegment} />
          ))}
        </div>
      </section>

      <section aria-label={t("customers.pulseAria")} className="mb-section shrink-0">
        <React.Suspense
          fallback={
            <div className="grid gap-stack lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[168px] rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className={showMoney ? "grid gap-stack lg:grid-cols-3" : "grid gap-stack lg:grid-cols-2"} data-testid="customers-pulse">
            <MetricCard
              label={t("customers.pulse.returning")}
              value={formatPercent(pulse.returningRate)}
              caption={t("customers.pulse.returningCaption", { count: pulse.visited })}
              hint={t("customers.pulse.returningHint")}
              tone="brand"
              icon="users"
              chart={<MetricRing value={pulse.returningRate} color={ringColor} ariaLabel={`${t("customers.pulse.returning")}: ${formatPercent(pulse.returningRate)}`} />}
            />
            {showMoney && <MetricCard label={t("customers.pulse.ltv")} value={formatMoney(pulse.avgLtv)} caption={t("customers.pulse.ltvCaption", { total: formatMoney(pulse.totalLtv) })} hint={t("customers.pulse.ltvHint")} tone="positive" icon="chart" />}
            <MetricCard
              label={t("customers.pulse.onTrack")}
              value={formatPercent(100 - pulse.driftingRate)}
              caption={t("customers.pulse.onTrackCaption", { count: pulse.drifting })}
              hint={t("customers.pulse.onTrackHint")}
              tone="warning"
              icon="calendar"
              chart={<MetricDial value={100 - pulse.driftingRate} ariaLabel={`${t("customers.pulse.onTrack")}: ${formatPercent(100 - pulse.driftingRate)}`} />}
            />
          </div>
        </React.Suspense>
      </section>

      <AttentionStrip
        className="mb-section shrink-0"
        label={t("customers.alert.aria")}
        tone={calm ? "positive" : "warning"}
        icon={calm ? CheckCircle2 : TriangleAlert}
        title={calm ? t("customers.alert.calmTitle") : t("customers.alert.title", { count: attention })}
        detail={calm ? t("customers.alert.calmDetail") : t("customers.alert.detail")}
      >
        {CUSTOMER_ALERTS.map((item) => {
          const count = pool.filter(item.matches).length;
          if (count === 0 && alert !== item.id) return null;
          return <AttentionAction key={item.id} icon={item.icon} label={t(item.labelKey)} hint={t(item.hintKey, { days: BIRTHDAY_WINDOW_DAYS, misses: UNRELIABLE_MISSES })} value={count} tone={item.tone} active={alert === item.id} onClick={() => pickAlert(item.id)} />;
        })}
      </AttentionStrip>

      <DataListBlock
        tableId="clientes-lista"
        title={t("customers.listTitle")}
        noun={t("customers.noun")}
        gender="m"
        rows={filtered}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        searchBy={(row) => `${row.name} ${showContact ? `${row.email} ${row.phone.replace(/\D/g, "")}` : ""} ${t(SEGMENT_KEYS[row.segment])} ${branchName(row.branchId)}`}
        searchPlaceholder={t("customers.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onActionsPlacementChange={setActionsPlacement}
        recordActions={actions}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-text-muted">
            <p>{hasFilter ? t("customers.emptyFiltered") : t("customers.emptySearch")}</p>
            {hasFilter && (
              <Button size="sm" variant="outline" onClick={() => setFilters({ tipo: null, aviso: null })}>
                {t("customers.clearFilters")}
              </Button>
            )}
          </div>
        }
        renderListItem={(row, state) => (
          <ListItem
            leading={
              <span className="flex items-center gap-3">
                {state.checkbox}
                <CustomerAvatar name={row.name} avatarUrl={row.avatarUrl} />
              </span>
            }
            title={row.name}
            description={[showContact ? maskPhone(row.phone) : null, row.lastVisitAt ? formatAgo(row.lastVisitAt, formatRelativeTime) : t("customers.neverVisited")].filter(Boolean).join(" · ")}
            meta={showMoney ? <span className="tabular-nums">{row.ltv === 0 ? "—" : formatMoney(row.ltv)}</span> : undefined}
            actions={
              <>
                <SegmentBadge segment={row.segment} />
                {state.menu}
              </>
            }
            selected={state.selected}
          />
        )}
      />

      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail selectedCount={selected.size} onClearSelection={() => setSelected(new Set())} actions={actions} gender="m" isBlocked={drawer !== null || confirmBlock !== null || confirmDelete !== null} />
        </ShellRailSlot>
      )}

      <CustomerFormDrawer open={drawer === "create"} onOpenChange={(open) => !open && setDrawer(null)} branchId={branchId} onCreated={(customer) => navigate(`/clientes/${customer.id}`)} />
      <CustomerImportDrawer open={importing} onOpenChange={setImporting} branchId={branchId} />
      <ReactivationDrawer open={reactivating} onOpenChange={setReactivating} branchId={branchId} />
      {perms.canLogPrivacy && <PrivacyRequestsDrawer open={privacyOpen} onOpenChange={setPrivacyOpen} canClose={perms.canManagePrivacy} />}
      <CustomerNoteDrawer open={drawer === "note"} onOpenChange={(open) => !open && setDrawer(null)} customerId={single?.id ?? null} customerName={single?.name ?? ""} />

      <ConfirmDialog
        open={confirmBlock !== null}
        onOpenChange={(open) => !open && setConfirmBlock(null)}
        variant={confirmBlock?.blocked ? "default" : "destructive"}
        title={t(confirmBlock?.blocked ? "customers.unblock.title" : "customers.block.title", { name: confirmBlock?.name ?? "" })}
        description={t(confirmBlock?.blocked ? "customers.unblock.hint" : "customers.block.hint")}
        confirmLabel={t(confirmBlock?.blocked ? "customers.action.unblock" : "customers.action.block")}
        loading={setBlocked.isPending}
        onConfirm={() => {
          if (!confirmBlock) return;
          const blocking = !confirmBlock.blocked;
          setBlocked.mutate(
            { id: confirmBlock.id, blocked: blocking },
            {
              onSuccess: () => {
                toast.success(t(blocking ? "customers.block.done" : "customers.unblock.done"), { description: confirmBlock.name });
                setConfirmBlock(null);
                setSelected(new Set());
              },
              onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
            }
          );
        }}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        variant="destructive"
        title={t("customers.delete.title", { name: confirmDelete?.name ?? "" })}
        description={t("customers.delete.hint")}
        confirmLabel={t("customers.action.delete")}
        loading={deleteCustomer.isPending}
        onConfirm={() => {
          if (!confirmDelete) return;
          deleteCustomer.mutate(confirmDelete.id, {
            onSuccess: () => {
              toast.success(t("customers.delete.done"), { description: confirmDelete.name });
              setConfirmDelete(null);
              setSelected(new Set());
            },
            onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
          });
        }}
      />
    </>
  );
}
