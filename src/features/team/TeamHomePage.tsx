import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowUpNarrowWide, BellRing, CalendarCheck, CheckCircle2, Layers, ListOrdered, Pencil, ToggleRight, TriangleAlert, Upload, UserMinus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard, MetricDial, MetricRing, SparklineChart, getChartTheme } from "@/components/charts";
import { AttentionAction, AttentionStrip } from "@/components/feedback";
import { PageHeader } from "@/components/utility";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { OptionTile } from "@/components/selection";
import { DataListActionRail, ScreenHeaderActions, type RailActionSpec } from "@/components/action-rail";
import { CreateMemberDrawer } from "./CreateMemberDrawer";
import { ActivateTeamDrawer } from "./ActivateTeamDrawer";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { DataListBlock } from "@/components/blocks";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { ListItem } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TableShell } from "@/components/data-display/TableShell";
import { useLocale } from "@/i18n";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";
import { useAccess } from "@/features/access";
import { useBranchId } from "./teamUtils";
import { creatableRoles, seesBarberMoney, seesManagers } from "./teamAccess";
import { useMembersQuery } from "./queries";
import { TeamPersonAvatar } from "./teamShared";
import {
  ALL_ROLES,
  IDLE_OCCUPANCY,
  OPEN_SHIFTS,
  ROLE_BY_ID,
  TEAM_MEMBERS,
  TEAM_ROLES,
  TEAM_STATUS_KEYS,
  alertsForRole,
  branchName,
  formatRowDate,
  membersOfRole,
  teamCells,
  teamColumns,
  teamMetrics,
  type TeamAlertId,
  type TeamRoleFilter,
} from "./teamHome";

const PAGE_SIZE = 10;

/**
 * Lo que se puede hacer con el equipo, declarado una vez con su ámbito. Sin
 * nadie marcado son las de la pantalla; con una persona entran las suyas, y
 * con varias se caen las que solo valen para una.
 *
 * Las de pantalla van en tres pesos, porque no se usan ni de lejos igual de
 * seguido: dar de alta a alguien es lo de todas las semanas y se lleva la
 * principal; el orden en que salen los barberos se retoca cada vez que entra
 * o sale alguien y se queda a la vista; los niveles, la regla del
 * agendamiento sin preferencia y el alta del equipo en la sucursal se tocan
 * al montar la barbería y después casi nunca, así que se pliegan en «más
 * acciones» en vez de competir por sitio.
 *
 * Sumar gente tiene dos caminos y van juntos: uno a la vez con la principal,
 * varios de una carga con «Cargar miembros» justo a su lado —es la misma
 * decisión con otro volumen, no una configuración aparte, así que no se
 * pliega con las de «más acciones»—.
 */
interface TeamHomeHandlers {
  sortBarbers: () => void;
  createLevel: () => void;
  walkInOrder: () => void;
  enableInBranch: () => void;
  createMember: () => void;
  edit: () => void;
  schedule: () => void;
}

/** Qué casilla de la matriz abre cada acción; las que no salen aquí no se ofrecen. */
type TeamActionId = "sort-barbers" | "create-level" | "walk-in-order" | "enable-in-branch" | "bulk-import" | "create-member" | "edit" | "schedule" | "remind" | "deactivate";

function railActions(t: (key: AppMessageKey) => string, on: TeamHomeHandlers, allowed: (id: TeamActionId) => boolean): readonly RailActionSpec[] {
  const all: readonly (RailActionSpec & { id: TeamActionId })[] = [
    { id: "sort-barbers", label: t("team.action.sortBarbers"), icon: <ArrowUpNarrowWide className="size-5" strokeWidth={2} />, scope: ["screen"], onSelect: on.sortBarbers },
    { id: "create-level", label: t("team.action.createLevel"), icon: <Layers className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.createLevel },
    { id: "walk-in-order", label: t("team.action.walkInOrder"), icon: <ListOrdered className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.walkInOrder },
    { id: "enable-in-branch", label: t("team.action.enableInBranch"), icon: <ToggleRight className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.enableInBranch },
    { id: "bulk-import", label: t("team.action.bulkImport"), icon: <Upload className="size-5" strokeWidth={2} />, scope: ["screen"] },
    { id: "create-member", label: t("team.action.createMember"), icon: <UserPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: on.createMember },
    { id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: on.edit },
    { id: "schedule", label: t("team.action.schedule"), icon: <CalendarCheck className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: on.schedule },
    { id: "remind", label: t("team.action.remind"), icon: <BellRing className="size-5" strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
    { id: "deactivate", label: t("team.action.deactivate"), icon: <UserMinus className="size-5" strokeWidth={2} />, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
  ];
  return all.filter((action) => allowed(action.id));
}

/** Un tono y un icono por métrica, en el orden del pulso. */
const METRIC_TONES = ["brand", "warning", "positive"] as const;
const METRIC_ICONS = ["calendar", "chart", "users"] as const;

/** El color de marca del tema para el anillo; se resuelve al montar. */
const ringColor = getChartTheme().color[0];

/**
 * El home de equipo.
 *
 * Es el mismo molde que el home de procesos —de qué partir, cómo va, qué
 * necesita una mano y la lista con todo—, con dos diferencias de fondo:
 *
 * 1. Arriba no hay plantillas. A un equipo no se le «empieza desde una
 *    plantilla»: lo que se quiere de un vistazo es **quién es quién**, así que
 *    esa fila la ocupa el reparto por rol, y además filtra la lista.
 * 2. Todo lo demás cuelga del rol. Las columnas que aplican, lo que se le
 *    liquida a cada quien y sobre todo los avisos: la renta solo la debe quien
 *    alquila su silla, la caja solo la cuadra quien cobra.
 *
 * Los datos son los de `teamHome.tsx`, deterministas y sin backend; al
 * conectarla se sustituye ese módulo por la consulta de la sucursal activa.
 */
export function TeamHomePage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { current, formatNumber } = useLocale();

  const formatCount = React.useCallback((value: number) => formatNumber(value), [formatNumber]);
  const formatMoney = React.useCallback(
    (value: number) => formatNumber(value, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    [formatNumber]
  );
  const formatPercent = React.useCallback(
    (value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`,
    [formatNumber]
  );
  const formatDelta = React.useCallback(
    (value: number, unit: "percent" | "count") =>
      `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value), { maximumFractionDigits: 1 })}${unit === "percent" ? " pp" : ""}`,
    [formatNumber]
  );

  const branchId = useBranchId();
  /* Quien mira decide qué se ofrece: el barbero por comisión ve al equipo en
     lectura —sin acciones, sin gerentes, sin dinero ni contactos de colegas—;
     el administrador no ve al dueño ni el dinero de los barberos. */
  const access = useAccess();
  const manages = access.can("team", "edit");
  const money = seesBarberMoney(access);
  const visibleRoles = React.useMemo(
    () => TEAM_ROLES.filter((spec) => (seesManagers(access) || spec.scope === "chair") && (access.role === "owner" || spec.id !== "owner")),
    [access]
  );
  const allowAction = React.useCallback(
    (id: TeamActionId): boolean => {
      switch (id) {
        case "sort-barbers":
          return access.can("barber-order", "edit");
        case "create-level":
          return access.can("levels", "create");
        case "walk-in-order":
          return access.can("lineup", "edit");
        case "bulk-import":
        case "create-member":
          return creatableRoles(access).length > 0;
        case "deactivate":
          return access.can("team", "delete");
        default:
          return access.can("team", "edit");
      }
    },
    [access]
  );
  const showContact = React.useCallback((row: { id: string }) => manages || row.id === access.member?.id, [manages, access.member]);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [drawer, setDrawer] = React.useState<"create" | "activate" | null>(null);
  /* Las acciones de la barra llevan a las pantallas del módulo: la ficha, el
     orden, los niveles, la fila y la activación por sucursal. */
  const actions = React.useMemo(() => {
    const single = [...selected][0];
    return railActions(t, {
      sortBarbers: () => navigate("/usuarios/orden"),
      createLevel: () => navigate("/usuarios/niveles"),
      walkInOrder: () => navigate("/usuarios/fila"),
      enableInBranch: () => setDrawer("activate"),
      createMember: () => setDrawer("create"),
      edit: () => single && navigate(`/usuarios/miembros/${single}?editar=1`),
      schedule: () => single && navigate(`/calendario?equipo=${single}`),
    }, allowAction);
  }, [allowAction, navigate, selected, t]);
  const selectable = actions.some((action) => action.scope.includes("single") || action.scope.includes("bulk"));
  const columns = React.useMemo(() => teamColumns(t, { money }), [t, money]);
  /* Las fotos vienen con el equipo de la API (todas las sucursales); mientras
     llega, o si falla, cada fila enseña las iniciales. */
  const membersQuery = useMembersQuery(branchId, true);
  const avatarOf = React.useMemo(() => {
    const byId = new Map((membersQuery.data?.items ?? []).map((item) => [item.id, item.avatarUrl] as const));
    return (id: string) => byId.get(id) ?? null;
  }, [membersQuery.data]);
  const cells = React.useMemo(
    () => teamCells(t, { intlLocale: current.intl, formatCount, formatMoney, avatarOf, showContact }),
    [t, current.intl, formatCount, formatMoney, avatarOf, showContact]
  );

  const [tab, setTab] = React.useState("equipo");
  const [role, setRole] = React.useState<TeamRoleFilter>(ALL_ROLES);
  const [alert, setAlert] = React.useState<TeamAlertId | null>(null);
  /* Lo decide quien mira, desde el panel de configuración de la tabla; la
     pantalla solo necesita saberlo para no repetir las acciones en el rail. */
  const [actionsPlacement, setActionsPlacement] = React.useState<TableActionsPlacement>("rail");
  const railOwnsActions = actionsPlacement === "rail";
  const clearSelection = () => setSelected(new Set());

  /* El rol puesto manda sobre toda la pantalla, no solo sobre la lista: de él
     salen las filas, el pulso de arriba y los avisos. El pulso porque a quien
     no corta enseñarle «ocupación de sillas» sería enseñarle un cero —lo
     suyo es cómo va su equipo—, y los avisos porque cada rol solo puede
     resolver los que le tocan. */
  const visibleIds = React.useMemo(() => new Set<string>(visibleRoles.map((spec) => spec.id)), [visibleRoles]);
  const everyone = React.useMemo(() => TEAM_MEMBERS.filter((member) => visibleIds.has(member.role)), [visibleIds]);
  const pool = React.useMemo(() => membersOfRole(role, everyone), [role, everyone]);
  const metrics = React.useMemo(() => teamMetrics(role), [role]);
  const alerts = React.useMemo(() => alertsForRole(role), [role]);

  /* La descripción del rol elegido sube al título de la sección; en las fichas
     ocuparía una segunda línea y partiría la fila en dos. */
  const roleHint = role === ALL_ROLES ? t("team.allRolesHint") : t(ROLE_BY_ID[role].hintKey);

  /* Dos filtros y nada más: el rol de la fila de arriba y el aviso encendido.
     La búsqueda, las columnas, la paginación y la selección las opera
     `DataListBlock`. */
  const preset = alerts.find((item) => item.id === alert);
  const filtered = React.useMemo(
    () => pool.filter((member) => !preset || preset.matches(member)),
    [pool, preset]
  );

  const attention = pool.filter((member) => alerts.some((item) => item.matches(member))).length;
  const calm = attention === 0;

  /* Cambiar de rol con un aviso puesto puede dejar la lista en blanco —«caja
     sin cerrar» no le pasa a un barbero—, así que elegir rol suelta el aviso. */
  const pickRole = (value: string) => {
    setRole(value as TeamRoleFilter);
    setAlert(null);
    setTab("equipo");
  };

  const pickAlert = (id: TeamAlertId) => {
    setTab("equipo");
    setAlert((active) => (active === id ? null : id));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Las migas viven en el header del shell; la cabecera de la pantalla se
          queda con el título, su contexto y sus acciones (ver
          docs/SCREEN_BUILD_RULES.md). */}
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, t("team.title")]} />
      </ShellHeaderSlot>

      <PageHeader
        title={t("team.title")}
        description={t("team.description")}
        actions={
          railOwnsActions ? undefined : <ScreenHeaderActions actions={actions} moreLabel={t("action.more")} />
        }
      />

      {/* Donde el home de procesos ofrece plantillas, aquí va el reparto por
          rol: es lo primero que se quiere saber de un equipo y de paso filtra
          la lista de abajo. */}
      <section aria-label={t("team.rolesAria")} className="mb-section shrink-0">
        {/* El título y lo que hoy está filtrado comparten renglón: la explicación
            del rol elegido no gasta una línea propia. */}
        <div className="mb-stack flex items-baseline gap-2">
          <h2 className="shrink-0 text-sm font-semibold text-text-secondary">{t("team.roles")}</h2>
          <p className="min-w-0 truncate text-xs text-text-muted">{roleHint}</p>
        </div>
        <div
          role="radiogroup"
          aria-label={t("team.rolesAria")}
          className="-mx-1 flex gap-stack overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
        >
          <OptionTile
            compact
            className="min-w-44 flex-1"
            option={{
              value: ALL_ROLES,
              label: t("team.allRoles"),
              badge: formatCount(everyone.length),
              icon: Users,
            }}
            selected={role === ALL_ROLES}
            onSelect={pickRole}
          />
          {visibleRoles.map((spec) => (
            <OptionTile
              key={spec.id}
              compact
              className="min-w-44 flex-1"
              option={{
                value: spec.id,
                label: t(spec.shortKey),
                badge: formatCount(TEAM_MEMBERS.filter((member) => member.role === spec.id).length),
                icon: spec.icon,
              }}
              selected={role === spec.id}
              onSelect={pickRole}
            />
          ))}
        </div>
      </section>

      {/* El pulso y los avisos son para quien gestiona al equipo: un colega no
          tiene nada que resolver en la agenda de los demás. */}
      {manages && (
      <section aria-label={t("team.metricsAria")} className="mb-section shrink-0">
        <React.Suspense
          fallback={
            <div className="grid gap-stack lg:grid-cols-3">
              {metrics.map((metric) => (
                <Skeleton key={metric.id} className="h-[168px] rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className="grid gap-stack lg:grid-cols-3">
            {metrics.map((metric, index) => {
              const delta = Math.round((metric.value - metric.previous) * 10) / 10;
              const label = t(metric.labelKey);
              const value = metric.unit === "percent" ? formatPercent(metric.value) : formatCount(metric.value);
              return (
                <MetricCard
                  key={metric.id}
                  label={label}
                  value={value}
                  delta={delta}
                  deltaLabel={formatDelta(delta, metric.unit)}
                  /* Un turno sin cubrir menos es una buena noticia aunque el
                     delta baje: ahí el signo miente. */
                  deltaTone={metric.lowerIsBetter && delta !== 0 ? (delta < 0 ? "positive" : "negative") : undefined}
                  caption={t("team.metric.caption", { count: metric.basis })}
                  hint={t(metric.hintKey)}
                  tone={METRIC_TONES[index]}
                  icon={METRIC_ICONS[index]}
                  chartPlacement={index === 1 ? "bottom" : "side"}
                  chart={
                    index === 0 ? (
                      <MetricRing value={metric.value} color={ringColor} ariaLabel={`${label}: ${value}`} />
                    ) : index === 1 ? (
                      <SparklineChart data={[...metric.series]} height={44} />
                    ) : (
                      <MetricDial value={metric.value} ariaLabel={`${label}: ${value}`} />
                    )
                  }
                />
              );
            })}
          </div>
        </React.Suspense>
      </section>
      )}

      {/* Un aviso por cosa que alguien tiene que resolver hoy, y cada uno dice
          a qué roles le pasa. Al pulsarlo filtra la lista, así que también
          trae adelante su pestaña si se estaba en la otra. */}
      {manages && (
      <AttentionStrip
        className="mb-section shrink-0"
        label={t("team.alert.aria")}
        tone={calm ? "positive" : "warning"}
        icon={calm ? CheckCircle2 : TriangleAlert}
        title={calm ? t("team.alert.calmTitle") : t("team.alert.title", { count: attention })}
        detail={calm ? t("team.alert.calmDetail") : t("team.alert.detail")}
      >
        {alerts.map((item) => {
          const count = pool.filter(item.matches).length;
          if (count === 0 && alert !== item.id) return null;
          const roles = item.roles.map((id) => t(ROLE_BY_ID[id].shortKey)).join(" · ");
          const appliesTo = item.scope === "managed" ? "team.alert.managedBy" : "team.alert.appliesTo";
          return (
            <AttentionAction
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              hint={`${t(item.hintKey, { min: IDLE_OCCUPANCY })} ${t(appliesTo, { roles })}`}
              value={count}
              tone={item.tone}
              active={alert === item.id}
              onClick={() => pickAlert(item.id)}
            />
          );
        })}
      </AttentionStrip>
      )}

      <div className="shrink-0">
        <ThemaTabs
          className="mb-3"
          variant="page"
          fitContent
          tabs={[
            { id: "equipo", label: t("team.tab.people"), icon: <Users className="size-4" /> },
            ...(manages ? [{ id: "turnos", label: t("team.tab.shifts"), icon: <CalendarCheck className="size-4" /> }] : []),
          ]}
          activeTabId={tab}
          onTabChange={setTab}
        />
      </div>

      {tab === "equipo" || !manages ? (
        <DataListBlock
          tableId="equipo-personas"
          title={t("team.listTitle")}
          noun={t("team.noun")}
          gender="f"
          rows={filtered}
          columns={columns}
          cells={cells}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          searchBy={(row) => `${row.name} ${showContact(row) ? row.email : ""} ${t(ROLE_BY_ID[row.role].labelKey)} ${branchName(row.branchId)}`}
          pageSize={PAGE_SIZE}
          selectable={selectable}
          selected={selected}
          onSelectedChange={setSelected}
          onActionsPlacementChange={setActionsPlacement}
          recordActions={actions}
          emptyState={
            <p className="py-6 text-center text-sm text-text-muted">
              {alert || role !== ALL_ROLES ? t("team.emptyFiltered") : t("team.empty")}
            </p>
          }
          /* La misma lista y la misma selección: solo cambia el dibujo. Se
             queda con quién es, dónde atiende y cómo va su agenda, que es lo
             que se busca cuando las columnas sobran. */
          renderListItem={(row, state) => (
            <ListItem
              leading={
                <span className="flex items-center gap-3">
                  {state.checkbox}
                  <TeamPersonAvatar name={row.name} avatarUrl={avatarOf(row.id)} />
                </span>
              }
              title={row.name}
              description={`${t(ROLE_BY_ID[row.role].labelKey)} · ${branchName(row.branchId)}${
                row.lastActiveOffset === null ? "" : ` · ${formatRowDate(row.lastActiveOffset, current.intl)}`
              }`}
              meta={
                row.occupancy === null ? null : (
                  <span className="flex items-center gap-inline">
                    <Progress value={Math.min(100, row.occupancy)} className="h-1.5 w-20" />
                    <span className="w-10 text-right tabular-nums">{row.occupancy}%</span>
                  </span>
                )
              }
              actions={
                <>
                  <StatusBadge
                    status={row.status === "active" ? "active" : row.status === "invited" ? "pending" : "inactive"}
                    label={t(TEAM_STATUS_KEYS[row.status])}
                  />
                  {state.menu}
                </>
              }
              selected={state.selected}
            />
          )}
        />
      ) : (
        <TableShell title={t("team.shifts.title")} description={t("team.shifts.description")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("team.shifts.day")}</TableHead>
                <TableHead>{t("team.shifts.slot")}</TableHead>
                <TableHead>{t("team.shifts.branch")}</TableHead>
                <TableHead>{t("team.shifts.chair")}</TableHead>
                <TableHead>{t("team.shifts.reason")}</TableHead>
                <TableHead className="text-right">{t("team.shifts.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OPEN_SHIFTS.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium text-text-primary">{formatRowDate(shift.dayOffset, current.intl)}</TableCell>
                  <TableCell className="text-text-secondary tabular-nums">{shift.slot}</TableCell>
                  <TableCell className="text-text-secondary">{branchName(shift.branchId)}</TableCell>
                  <TableCell className="text-text-secondary">{t("team.chair", { number: shift.chair })}</TableCell>
                  <TableCell className="text-text-secondary">{t(shift.reasonKey)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="xs" variant="outline">
                      {t("team.shifts.assign")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      )}

      {/* Con las acciones en la barra, la selección las *sustituye*: no se
          apilan las de la pantalla con las de las filas. */}
      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail selectedCount={selected.size} onClearSelection={clearSelection} actions={actions} gender="f" isBlocked={drawer !== null} />
        </ShellRailSlot>
      )}

      <CreateMemberDrawer open={drawer === "create"} onOpenChange={(open) => !open && setDrawer(null)} />
      <ActivateTeamDrawer open={drawer === "activate"} onOpenChange={(open) => !open && setDrawer(null)} branchId={branchId} />
    </div>
  );
}
