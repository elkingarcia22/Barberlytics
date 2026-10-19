import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowUpNarrowWide, CheckCircle2, Eye, FolderTree, LayoutGrid, Layers, Pencil, Plus, Power, PowerOff, Scissors, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { DataListBlock } from "@/components/blocks";
import { MetricCard, MetricRing, getChartTheme } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { AttentionAction, AttentionStrip, EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { OptionTile } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/utility";
import { useAccess } from "@/features/access";
import { catalogAccess } from "@/features/catalog/catalogAccess";
import { useMoney } from "@/features/calendar/calendarFormat";
import { useBranchId } from "@/features/team/teamUtils";
import { CategoriesDrawer } from "./CategoriesDrawer";
import { MenuEngineeringView } from "./MenuEngineeringView";
import { ServiceFormDrawer } from "./ServiceFormDrawer";
import { useRemoveService, useServicesQuery, useSetServicesActive } from "./queries";
import { ALL, SERVICE_ALERTS, parseCategory, parseKind, serviceCells, serviceColumns, servicesPulse, type ServiceAlertId } from "./servicesHome";
import { ActiveBadge, ServiceGlyph } from "./servicesShared";
import { categoryName, formatDuration } from "./servicesUtils";
import type { CatalogService, ServiceKind, ServicesCatalog } from "./types";

const PAGE_SIZE = 10;
const ringColor = getChartTheme().color[0];
const ALERT_IDS: readonly string[] = SERVICE_ALERTS.map((alert) => alert.id);
/* En el móvil las categorías son una fila que se desliza; desde `sm`, una rejilla con todas a la vista. */
const TILE_CLASS = "w-44 shrink-0 sm:w-auto";

/**
 * El catálogo de servicios.
 *
 * Una sola lista donde antes había tres pestañas: las categorías pasan a ser
 * el filtro de arriba —con su recuento— y servicios y combos conviven,
 * separables con un selector. Activar o desactivar se hace aquí mismo, sobre
 * las filas marcadas, en vez de en una pantalla aparte. Los filtros viven en
 * la URL.
 */
export function ServicesPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const branchId = useBranchId();
  const query = useServicesQuery(branchId);
  // La rentabilidad lleva costos, comisiones y márgenes: solo para quien ve el dinero del catálogo.
  const access = useAccess();
  const seesMoney = React.useMemo(() => catalogAccess(access, "services").seesMoney, [access]);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = seesMoney && searchParams.get("vista") === "rentabilidad" ? "menu" : "catalog";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("services.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("services.title")} description={t("services.description")} />

      {seesMoney && (
        <ThemaTabs
          className="mb-section"
          fitContent
          tabs={[
            { id: "catalog", label: t("services.view.catalog") },
            { id: "menu", label: t("services.view.menu") },
          ]}
          activeTabId={view}
          onTabChange={(next) =>
            setSearchParams(
              (current) => {
                const params = new URLSearchParams(current);
                if (next === "menu") params.set("vista", "rentabilidad");
                else params.delete("vista");
                return params;
              },
              { replace: true }
            )
          }
        />
      )}

      {view === "menu" ? (
        <MenuEngineeringView branchId={branchId} />
      ) : (
        <QueryBoundary
          query={query}
          loading={
            <div className="space-y-section" data-testid="services-loading">
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
          {(data) => <ServicesHome catalog={data} branchId={branchId} />}
        </QueryBoundary>
      )}
    </div>
  );
}

type Drawer = { kind: "create"; of: ServiceKind } | { kind: "edit"; service: CatalogService } | { kind: "categories" };

function ServicesHome({ catalog, branchId }: { catalog: ServicesCatalog; branchId: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { formatNumber } = useLocale();
  const formatMoney = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const setActive = useSetServicesActive(branchId);
  const remove = useRemoveService();
  const { categories, items } = catalog;

  const category = parseCategory(searchParams.get("categoria"), categories);
  const kind = parseKind(searchParams.get("tipo"));
  const alertParam = searchParams.get("aviso");
  const alert = ALERT_IDS.includes(alertParam ?? "") ? (alertParam as ServiceAlertId) : null;
  const setFilters = (next: { categoria?: string | null; tipo?: string | null; aviso?: string | null }) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        for (const [key, value] of Object.entries(next)) {
          if (value && value !== ALL) params.set(key, value);
          else params.delete(key);
        }
        return params;
      },
      { replace: true }
    );

  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [drawer, setDrawer] = React.useState<Drawer | null>(null);
  const [removing, setRemoving] = React.useState<CatalogService | null>(null);
  const [actionsPlacement, setActionsPlacement] = React.useState<TableActionsPlacement>("rail");
  const railOwnsActions = actionsPlacement === "rail";
  const clearSelection = () => setSelected(new Set());

  const formatPercent = React.useCallback((value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`, [formatNumber]);
  // Cada acción va por su casilla; borrar es del dueño (es para toda la barbería).
  const access = useAccess();
  const can = React.useMemo(() => catalogAccess(access, "services"), [access]);
  const columns = React.useMemo(() => serviceColumns(t, { money: can.seesMoney }), [t, can.seesMoney]);
  const cells = React.useMemo(() => serviceCells(t, { categories, formatMoney, formatPercent }), [t, categories, formatMoney, formatPercent]);

  const pool = React.useMemo(() => items.filter((item) => (category === ALL || item.categoryId === category) && (kind === ALL || item.kind === kind)), [items, category, kind]);
  const pulse = React.useMemo(() => servicesPulse(pool), [pool]);
  const preset = SERVICE_ALERTS.find((item) => item.id === alert);
  const filtered = React.useMemo(() => pool.filter((item) => !preset || preset.matches(item)), [pool, preset]);
  const attention = pool.filter((item) => SERVICE_ALERTS.some((spec) => (can.seesMoney || spec.id !== "noCost") && spec.matches(item))).length;
  const calm = attention === 0;

  const marked = React.useMemo(() => items.filter((item) => selected.has(item.id)), [items, selected]);
  const single = marked.length === 1 ? marked[0] : undefined;
  /* Si todo lo marcado está activo, la acción es apagarlo; si hay algo apagado, encenderlo. */
  const turningOn = marked.some((item) => !item.active);

  const toggleActive = React.useCallback(() => {
    if (marked.length === 0) return;
    setActive.mutate(
      { serviceIds: marked.map((item) => item.id), active: turningOn },
      {
        onSuccess: () => {
          toast.success(t(turningOn ? "services.activated" : "services.deactivated", { count: marked.length }), { description: t(turningOn ? "services.activatedHint" : "services.deactivatedHint") });
          setSelected(new Set());
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  }, [marked, setActive, t, turningOn]);

  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => {
      const allowed: Readonly<Record<string, boolean>> = { order: can.canOrder, categories: can.categories.view, "create-combo": can.canCreate, create: can.canCreate, open: true, edit: can.canEdit, toggle: can.canToggle, delete: can.canDelete };
      const all: readonly RailActionSpec[] = [
      { id: "order", label: t("services.action.order"), icon: <ArrowUpNarrowWide className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => navigate("/servicios/orden") },
      { id: "categories", label: t("services.action.categories"), icon: <FolderTree className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer({ kind: "categories" }) },
      { id: "create-combo", label: t("services.action.createCombo"), icon: <Layers className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: () => setDrawer({ kind: "create", of: "combo" }) },
      { id: "create", label: t("services.action.create"), icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: () => setDrawer({ kind: "create", of: "service" }) },
      { id: "open", label: t("services.action.open"), icon: <Eye className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: () => single && navigate(`/servicios/${single.id}`) },
      { id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: () => single && setDrawer({ kind: "edit", service: single }) },
      {
        id: "toggle",
        label: t(turningOn ? "services.action.activate" : "services.action.deactivate"),
        icon: turningOn ? <Power className="size-5" strokeWidth={2} /> : <PowerOff className="size-5" strokeWidth={2} />,
        scope: ["single", "bulk"],
        countInLabel: true,
        onSelect: toggleActive,
      },
      { id: "delete", label: t("action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["single"], tone: "danger", onSelect: () => single && setRemoving(single) },
      ];
      return all.filter((action) => allowed[action.id]);
    },
    [can, navigate, single, t, toggleActive, turningOn]
  );

  /* Cambiar de categoría o de tipo con un aviso puesto puede dejar la lista en blanco, así que lo suelta. */
  const pickCategory = (value: string) => {
    setFilters({ categoria: value, aviso: null });
    clearSelection();
  };
  const pickKind = (value: string) => {
    setFilters({ tipo: value, aviso: null });
    clearSelection();
  };
  const pickAlert = (id: ServiceAlertId) => setFilters({ aviso: alert === id ? null : id });

  const activeCategory = categories.find((item) => item.id === category);
  const categoryHint = activeCategory ? activeCategory.description || t("services.category.noDescription") : t("services.category.allHint");
  const hasFilter = category !== ALL || kind !== ALL || alert !== null;
  const countOf = (of: ServiceKind) => items.filter((item) => item.kind === of && (category === ALL || item.categoryId === category)).length;

  const drawers = (
    <>
      <ServiceFormDrawer
        open={drawer?.kind === "create" || drawer?.kind === "edit"}
        onOpenChange={(open) => !open && setDrawer(null)}
        service={drawer?.kind === "edit" ? drawer.service : null}
        kind={drawer?.kind === "create" ? drawer.of : "service"}
        categories={categories}
        items={items}
        branchId={branchId}
        defaultCategoryId={category === ALL ? undefined : category}
        onCreated={(service) => navigate(`/servicios/${service.id}?pestana=equipo`)}
      />
      <CategoriesDrawer open={drawer?.kind === "categories"} onOpenChange={(open) => !open && setDrawer(null)} categories={categories} items={items} canCreate={can.categories.create} canEdit={can.categories.edit} canDelete={can.categories.delete} />
    </>
  );

  if (items.length === 0) {
    return (
      <>
        <EmptyState
          icon="scissors"
          title={t("services.emptyTitle")}
          description={t("services.emptyHint")}
          action={
            can.canCreate ? (
              <Button onClick={() => setDrawer({ kind: "create", of: "service" })}>
                <Plus /> {t("services.action.create")}
              </Button>
            ) : undefined
          }
        />
        {drawers}
      </>
    );
  }

  return (
    <>
      <section aria-label={t("services.categoriesAria")} className="mb-section shrink-0">
        <div className="mb-stack flex items-baseline gap-2">
          <h2 className="shrink-0 text-sm font-semibold text-text-secondary">{t("services.categories")}</h2>
          <p className="min-w-0 truncate text-xs text-text-muted" data-testid="services-category-hint">
            {categoryHint}
          </p>
        </div>
        <div role="radiogroup" aria-label={t("services.categoriesAria")} className="-mx-1 flex gap-stack overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:p-0 xl:grid-cols-6">
          <OptionTile compact className={TILE_CLASS} option={{ value: ALL, label: t("services.category.all"), badge: formatNumber(items.length), icon: LayoutGrid }} selected={category === ALL} onSelect={pickCategory} />
          {categories.map((item) => {
            const count = items.filter((service) => service.categoryId === item.id).length;
            /* Una categoría vacía no filtra nada: se gestiona desde su panel, no ocupa sitio aquí. */
            if (count === 0 && category !== item.id) return null;
            return <OptionTile key={item.id} compact className={TILE_CLASS} option={{ value: item.id, label: item.name, badge: formatNumber(count) }} selected={category === item.id} onSelect={pickCategory} />;
          })}
        </div>
      </section>

      <section aria-label={t("services.pulseAria")} className="mb-section shrink-0">
        <React.Suspense
          fallback={
            <div className="grid gap-stack lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[168px] rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className="grid gap-stack lg:grid-cols-3">
            <MetricCard
              label={t("services.pulse.active")}
              value={t("services.pulse.activeValue", { active: pulse.active, total: pulse.total })}
              caption={t("services.pulse.activeCaption")}
              hint={t("services.pulse.activeHint")}
              tone="brand"
              icon="scissors"
              chart={<MetricRing value={pulse.activeRate} color={ringColor} ariaLabel={`${t("services.pulse.active")}: ${formatPercent(pulse.activeRate)}`} />}
            />
            <MetricCard label={t("services.pulse.price")} value={formatMoney(pulse.avgPrice)} caption={t("services.pulse.priceCaption", { duration: formatDuration(pulse.avgDurationMin) })} hint={t("services.pulse.priceHint")} tone="positive" icon="chart" />
            {can.seesMoney && (
            <MetricCard
              label={t("services.pulse.margin")}
              value={pulse.avgMargin === null ? "—" : formatPercent(pulse.avgMargin)}
              caption={t("services.pulse.marginCaption", { count: pulse.withCost, total: pulse.active })}
              hint={t("services.pulse.marginHint")}
              tone="warning"
              icon="award"
              /* Anillo y no medidor: el medidor pinta «bajo 50» como riesgo, y un margen del 48 % no lo es. */
              chart={pulse.avgMargin === null ? undefined : <MetricRing value={pulse.avgMargin} color={ringColor} ariaLabel={`${t("services.pulse.margin")}: ${formatPercent(pulse.avgMargin)}`} />}
            />
            )}
          </div>
        </React.Suspense>
      </section>

      <AttentionStrip
        className="mb-section shrink-0"
        label={t("services.alert.aria")}
        tone={calm ? "positive" : "warning"}
        icon={calm ? CheckCircle2 : TriangleAlert}
        title={calm ? t("services.alert.calmTitle") : t("services.alert.title", { count: attention })}
        detail={calm ? t("services.alert.calmDetail") : t("services.alert.detail")}
      >
        {SERVICE_ALERTS.filter((item) => can.seesMoney || item.id !== "noCost").map((item) => {
          const count = pool.filter(item.matches).length;
          if (count === 0 && alert !== item.id) return null;
          return <AttentionAction key={item.id} icon={item.icon} label={t(item.labelKey)} hint={t(item.hintKey)} value={count} tone={item.tone} active={alert === item.id} onClick={() => pickAlert(item.id)} />;
        })}
      </AttentionStrip>

      <div className="shrink-0">
        <ThemaTabs
          className="mb-3"
          variant="page"
          fitContent
          tabs={[
            { id: ALL, label: t("services.kind.all"), badge: countOf("service") + countOf("combo") },
            { id: "service", label: t("services.kind.services"), icon: <Scissors className="size-4" />, badge: countOf("service") },
            { id: "combo", label: t("services.kind.combos"), icon: <Layers className="size-4" />, badge: countOf("combo") },
          ]}
          activeTabId={kind}
          onTabChange={pickKind}
        />
      </div>

      <DataListBlock
        tableId="servicios-catalogo"
        title={t("services.listTitle")}
        noun={t("services.noun")}
        gender="m"
        rows={filtered}
        columns={columns}
        cells={cells}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        searchBy={(row) => `${row.name} ${row.description} ${categoryName(categories, row.categoryId)}`}
        searchPlaceholder={t("services.searchPlaceholder")}
        pageSize={PAGE_SIZE}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onActionsPlacementChange={setActionsPlacement}
        recordActions={actions}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-text-muted">
            <p>{hasFilter ? t("services.emptyFiltered") : t("services.emptySearch")}</p>
            {hasFilter && (
              <Button size="sm" variant="outline" onClick={() => setFilters({ categoria: null, tipo: null, aviso: null })}>
                {t("services.clearFilters")}
              </Button>
            )}
          </div>
        }
        renderListItem={(row, state) => (
          <ListItem
            leading={
              <span className="flex items-center gap-3">
                {state.checkbox}
                <ServiceGlyph kind={row.kind} imageUrl={row.imageUrl} />
              </span>
            }
            title={row.name}
            description={`${categoryName(categories, row.categoryId)} · ${formatDuration(row.durationMin)}`}
            meta={<span className="font-medium tabular-nums text-text-primary">{formatMoney(row.branchPrice ?? row.price)}</span>}
            actions={
              <>
                <ActiveBadge active={row.active} />
                {state.menu}
              </>
            }
            selected={state.selected}
          />
        )}
      />

      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail selectedCount={selected.size} onClearSelection={clearSelection} actions={actions} gender="m" isBlocked={drawer !== null || removing !== null} />
        </ShellRailSlot>
      )}

      {drawers}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        variant="destructive"
        title={t("services.remove.title", { name: removing?.name ?? "" })}
        description={t("services.remove.hint")}
        confirmLabel={t("action.delete")}
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success(t("services.remove.done"), { description: removing.name });
              setRemoving(null);
              clearSelection();
            },
            onError: (error) => {
              toast.error(describeError(error).title, { description: describeError(error).description });
              setRemoving(null);
            },
          });
        }}
      />
    </>
  );
}
