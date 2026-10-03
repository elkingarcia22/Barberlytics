import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, CalendarClock, Check, FolderTree, Gift, Globe, Hourglass, Layers, Pencil, Power, PowerOff, SlidersHorizontal, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useLocale } from "@/i18n";
import { describeError } from "@/lib/api";
import { QueryBoundary } from "@/lib/query";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { MetricCard } from "@/components/charts";
import { ListItem } from "@/components/data-display/ListItem";
import { EmptyState } from "@/components/feedback";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { ConfirmDialog } from "@/components/overlays";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/typography";
import { PageHeader } from "@/components/utility";
import { initialsOf } from "@/components/scheduling";
import { useMoney } from "@/features/calendar/calendarFormat";
import { InfoCard, InfoRow } from "@/features/team/teamShared";
import { useBranchId } from "@/features/team/teamUtils";
import { ServiceFormDrawer } from "./ServiceFormDrawer";
import { useRemoveService, useServiceQuery, useServicesQuery, useSetServiceTeam, useSetServicesActive } from "./queries";
import { ActiveBadge, ServiceGlyph, VisibilityBadge } from "./servicesShared";
import { categoryName, comboTotals, formatDuration, marginOf } from "./servicesUtils";
import type { CatalogService, ServiceCategory, ServiceDetail } from "./types";

/**
 * La ficha de un servicio o de un combo. El resumen junta lo que antes
 * estaba en «General» y «Avanzado» —qué es, cuánto vale, cuánto deja y cómo
 * se agenda—; la pestaña Equipo dice quién lo ofrece y con qué valores. La
 * pestaña vive en la URL.
 */

const TABS = ["resumen", "equipo"] as const;
type ProfileTab = (typeof TABS)[number];
const TAB_KEYS: Readonly<Record<ProfileTab, AppMessageKey>> = { resumen: "services.tab.overview", equipo: "services.tab.team" };
const DATE_LONG: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export function ServiceProfilePage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const branchId = useBranchId();
  const service = useServiceQuery(id, branchId);
  const catalog = useServicesQuery(branchId);

  return (
    <div className="space-y-4">
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, { label: t("services.title"), onClick: () => navigate("/servicios") }, service.data?.name ?? t("services.profile.title")]} />
      </ShellHeaderSlot>

      <QueryBoundary
        query={service}
        loading={
          <div className="space-y-4" data-testid="service-loading">
            <Skeleton className="h-20 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
        error={(error, retry) => (
          <EmptyState
            title={t("services.profile.notFound")}
            description={`${t("services.profile.notFoundHint")} ${describeError(error).description}`}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/servicios")}>
                  <ArrowLeft /> {t("services.profile.back")}
                </Button>
                <Button onClick={retry}>{t("common.retry")}</Button>
              </div>
            }
          />
        )}
      >
        {(data) => <ServiceProfile service={data} categories={catalog.data?.categories ?? []} items={catalog.data?.items ?? []} branchId={branchId} />}
      </QueryBoundary>
    </div>
  );
}

interface ServiceProfileProps {
  service: ServiceDetail;
  categories: readonly ServiceCategory[];
  items: readonly CatalogService[];
  branchId: string;
}

function ServiceProfile({ service, categories, items, branchId }: ServiceProfileProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const formatMoney = useMoney();
  const [searchParams, setSearchParams] = useSearchParams();
  const setActive = useSetServicesActive(branchId);
  const remove = useRemoveService();
  const [editing, setEditing] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);

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

  const toggleActive = React.useCallback(() => {
    const turningOn = !service.active;
    setActive.mutate(
      { serviceIds: [service.id], active: turningOn },
      {
        onSuccess: () => toast.success(t(turningOn ? "services.activated" : "services.deactivated", { count: 1 }), { description: t(turningOn ? "services.activatedHint" : "services.deactivatedHint") }),
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );
  }, [service.active, service.id, setActive, t]);

  const actions = React.useMemo<readonly RailActionSpec[]>(
    () => [
      service.active
        ? { id: "deactivate", label: t("services.action.deactivate"), icon: <PowerOff className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: toggleActive }
        : { id: "activate", label: t("services.action.activate"), icon: <Power className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: toggleActive },
      { id: "delete", label: t("action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["screen"], tone: "danger", overflow: true, onSelect: () => setConfirmRemove(true) },
      { id: "edit", label: t("action.edit"), icon: <Pencil className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: () => setEditing(true) },
    ],
    [service.active, t, toggleActive]
  );

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ServiceGlyph kind={service.kind} size="lg" />
            <span className="flex flex-wrap items-center gap-2">
              {service.name}
              <ActiveBadge active={service.active} />
              <VisibilityBadge visibility={service.visibility} />
            </span>
          </span>
        }
        description={[t(service.kind === "combo" ? "services.kind.combo" : "services.kind.service"), categoryName(categories, service.categoryId), formatDuration(service.durationMin), formatMoney(service.price)].join(" · ")}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/servicios")}>
            <ArrowLeft /> {t("services.profile.back")}
          </Button>
        }
      />

      <ThemaTabs className="mb-4" variant="page" fitContent tabs={TABS.map((item) => ({ id: item, label: t(TAB_KEYS[item]), badge: item === "equipo" ? service.offeredBy : undefined }))} activeTabId={tab} onTabChange={(next) => setTab(next as ProfileTab)} />

      {tab === "resumen" ? <ServiceOverview service={service} categories={categories} items={items} formatMoney={formatMoney} /> : <ServiceTeam key={service.id} service={service} branchId={branchId} formatMoney={formatMoney} />}

      <ShellRailSlot>
        <DataListActionRail actions={actions} selectedCount={0} onClearSelection={() => undefined} isBlocked={editing || confirmRemove} />
      </ShellRailSlot>

      <ServiceFormDrawer open={editing} onOpenChange={setEditing} service={service} categories={categories} items={items} branchId={branchId} />

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        variant="destructive"
        title={t("services.remove.title", { name: service.name })}
        description={t("services.remove.hint")}
        confirmLabel={t("action.delete")}
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(service.id, {
            onSuccess: () => {
              toast.success(t("services.remove.done"), { description: service.name });
              navigate("/servicios");
            },
            onError: (error) => {
              toast.error(describeError(error).title, { description: describeError(error).description });
              setConfirmRemove(false);
            },
          })
        }
      />
    </>
  );
}

interface OverviewProps {
  service: ServiceDetail;
  categories: readonly ServiceCategory[];
  items: readonly CatalogService[];
  formatMoney: (value: number) => string;
}

function ServiceOverview({ service, categories, items, formatMoney }: OverviewProps) {
  const t = useAppT();
  const { formatNumber, formatDate } = useLocale();
  const margin = marginOf(service);
  const included = service.includes.map((id) => items.find((item) => item.id === id)).filter((item): item is CatalogService => item !== undefined);
  const totals = comboTotals(service.includes, items);
  const saving = totals.price - service.price;
  const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`;

  return (
    <div className="space-y-section">
      <section aria-label={t("services.overview.numbersAria")} className="grid gap-stack sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("services.column.price")} value={formatMoney(service.price)} caption={service.taxRate === null ? t("services.overview.noTax") : t("services.overview.plusTax", { rate: percent(service.taxRate) })} tone="brand" icon="chart" />
        <MetricCard
          label={t("services.column.duration")}
          value={formatDuration(service.durationMin)}
          caption={service.prep.enabled ? t(service.prep.position === "start" ? "services.overview.prepStart" : "services.overview.prepEnd", { minutes: service.prep.minutes }) : t("services.overview.noPrep")}
          tone="positive"
          icon="clock"
        />
        <MetricCard label={t("services.column.cost")} value={service.cost === null ? "—" : formatMoney(service.cost)} caption={service.cost === null ? t("services.overview.costMissing") : t("services.overview.costCaption")} hint={t("services.overview.costHint")} tone="warning" icon="file" />
        <MetricCard
          label={t("services.column.margin")}
          value={margin === null ? "—" : percent(margin)}
          caption={margin === null || service.cost === null ? t("services.overview.marginMissing") : t("services.overview.marginCaption", { amount: formatMoney(service.price - service.cost) })}
          hint={t("services.pulse.marginHint")}
          tone="brand"
          icon="award"
        />
      </section>

      <div className="grid items-start gap-stack lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-stack">
          <InfoCard title={t("services.overview.about")}>
            <Text tone={service.description ? "default" : "muted"}>{service.description || t("services.overview.noDescription")}</Text>
          </InfoCard>

          {service.kind === "combo" && (
            <InfoCard title={t("services.overview.includes")} description={t("services.overview.includesHint")}>
              <div className="space-y-2" data-testid="service-includes">
                {included.map((item) => (
                  <ListItem key={item.id} size="sm" leading={<ServiceGlyph kind="service" size="sm" />} title={item.name} description={formatDuration(item.durationMin)} meta={<span className="tabular-nums">{formatMoney(item.price)}</span>} />
                ))}
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <ComboFigure label={t("services.overview.separately")} value={formatMoney(totals.price)} />
                <ComboFigure label={t("services.overview.comboPrice")} value={formatMoney(service.price)} />
                <ComboFigure label={t("services.overview.saving")} value={saving > 0 ? formatMoney(saving) : "—"} highlight={saving > 0} />
              </dl>
            </InfoCard>
          )}
        </div>

        <InfoCard title={t("services.overview.booking")}>
          <InfoRow icon={<FolderTree />} label={t("services.column.category")}>
            {categoryName(categories, service.categoryId)}
          </InfoRow>
          <InfoRow icon={<Globe />} label={t("services.form.public")}>
            {t(service.visibility === "public" ? "services.overview.publicOn" : "services.overview.publicOff")}
          </InfoRow>
          <InfoRow icon={<Layers />} label={t("services.form.multiservice")}>
            {t(service.multiservice ? "services.overview.multiserviceOn" : "services.overview.multiserviceOff")}
          </InfoRow>
          <InfoRow icon={<Hourglass />} label={t("services.form.prep")}>
            {service.prep.enabled ? t(service.prep.position === "start" ? "services.overview.prepStart" : "services.overview.prepEnd", { minutes: service.prep.minutes }) : t("services.overview.noPrep")}
          </InfoRow>
          {service.kind === "combo" && (
            <InfoRow icon={<Gift />} label={t("services.form.giftCards")}>
              {t(service.giftCards ? "services.overview.yes" : "services.overview.no")}
            </InfoRow>
          )}
          <InfoRow icon={<CalendarClock />} label={t("services.overview.createdAt")}>
            {formatDate(new Date(service.createdAt), DATE_LONG)}
          </InfoRow>
        </InfoCard>
      </div>
    </div>
  );
}

function ComboFigure({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={highlight ? "text-sm font-semibold tabular-nums text-status-positive" : "text-sm font-semibold tabular-nums text-text-primary"}>{value}</dd>
    </div>
  );
}

interface TeamProps {
  service: ServiceDetail;
  branchId: string;
  formatMoney: (value: number) => string;
}

/**
 * Quién ofrece el servicio en la sucursal. Se marca y se guarda de una vez;
 * los valores propios de cada barbero —su precio, su duración, su comisión—
 * se ajustan en su ficha, que es donde ya vive ese formulario.
 */
function ServiceTeam({ service, branchId, formatMoney }: TeamProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const save = useSetServiceTeam(branchId);
  const saved = React.useMemo(() => new Set(service.team.filter((row) => row.offered).map((row) => row.memberId)), [service.team]);
  const [draft, setDraft] = React.useState<ReadonlySet<string> | null>(null);
  const offering = draft ?? saved;
  const dirty = draft !== null && (draft.size !== saved.size || [...draft].some((id) => !saved.has(id)));

  const toggle = (memberId: string, offered: boolean) => {
    const next = new Set(offering);
    if (offered) next.add(memberId);
    else next.delete(memberId);
    setDraft(next);
  };

  const persist = () =>
    save.mutate(
      { id: service.id, memberIds: [...offering] },
      {
        onSuccess: () => {
          toast.success(t("services.team.saved"), { description: t("services.team.savedHint", { count: offering.size, name: service.name }) });
          setDraft(null);
        },
        onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
      }
    );

  if (service.team.length === 0) return <EmptyState title={t("services.team.emptyTitle")} description={t("services.team.emptyHint")} />;

  const allOn = offering.size === service.team.length;

  return (
    <div className="space-y-4" data-testid="service-team">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-sm text-text-secondary">{t("services.team.hint")}</p>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{t("services.team.count", { count: offering.size, total: service.team.length })}</Badge>
          <Button variant="outline" size="sm" onClick={() => setDraft(allOn ? new Set() : new Set(service.team.map((row) => row.memberId)))}>
            {t(allOn ? "services.team.none" : "services.team.all")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {service.team.map((row) => {
          const offered = offering.has(row.memberId);
          return (
            <ListItem
              key={row.memberId}
              leading={
                <span className="flex items-center gap-3">
                  <Switch checked={offered} onCheckedChange={(checked) => toggle(row.memberId, checked)} aria-label={t("services.team.offersAria", { name: row.name })} />
                  <Avatar>
                    {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt="" />}
                    <AvatarFallback>{initialsOf(row.name)}</AvatarFallback>
                  </Avatar>
                </span>
              }
              title={row.name}
              description={offered ? `${formatMoney(row.price)} · ${formatDuration(row.durationMin)}` : t("services.team.notOffered")}
              meta={offered ? <Badge variant={row.custom ? "default" : "neutral"}>{t(row.custom ? "services.team.custom" : "services.team.usesCatalog")}</Badge> : null}
              actions={
                <Button variant="ghost" size="icon-sm" aria-label={t("services.team.adjustAria", { name: row.name })} disabled={!offered} onClick={() => navigate(`/usuarios/miembros/${row.memberId}?pestana=servicios&editar=1`)}>
                  <SlidersHorizontal />
                </Button>
              }
            />
          );
        })}
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-sticky flex justify-end gap-2 rounded-xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur">
          <Button variant="outline" onClick={() => setDraft(null)} disabled={save.isPending}>
            <X /> {t("common.cancel")}
          </Button>
          <Button onClick={persist} disabled={save.isPending} data-testid="service-team-save">
            <Check /> {t("services.form.save")}
          </Button>
        </div>
      )}
    </div>
  );
}
