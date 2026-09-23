import * as React from "react";
import { CheckCircle2, Copy, Download, GitCompare, Layers, Pencil, Plus, Trash2, TriangleAlert, Upload, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard, MetricDial, MetricRing, SparklineChart, getChartTheme } from "@/components/charts";
import { AttentionAction, AttentionStrip } from "@/components/feedback";
import { PageHeader } from "@/components/utility";
import { Breadcrumbs, ThemaTabs } from "@/components/navigation";
import { DataListActionRail, type RailActionSpec } from "@/components/action-rail";
import { ShellHeaderSlot, ShellRailSlot } from "@/components/app-shell";
import { TemplateCatalogDrawer, TemplateTile, type TemplateDefinition } from "@/components/templates";
import { DataListBlock } from "@/components/blocks";
import type { TableActionsPlacement } from "@/components/data-display/table-config";
import { ListItem } from "@/components/data-display/ListItem";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TableShell } from "@/components/data-display/TableShell";
import {
  ALERT_PRESETS,
  CLOSING_SOON_DAYS,
  PROCESS_ROWS,
  STATUS_KEYS,
  formatRowDate,
  processCells,
  processColumns,
  PULSE_METRICS,
  buildTemplates,
  buildTemplateGroups,
  type AlertId,
} from "./homeTemplate";
import { useLocale } from "@/i18n";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n/types";


const PAGE_SIZE = 10;

/**
 * Lo que se puede hacer, declarado una vez con su ámbito. La barra decide sola
 * cuáles enseña según lo que haya marcado: sin selección las de `screen`, con
 * un proceso también las de `single`, y con varios se caen las individuales.
 */
function railActions(t: (key: AppMessageKey) => string): readonly RailActionSpec[] {
  return [
    { id: "compare", label: t("action.compare"), icon: <GitCompare className="size-5" strokeWidth={2} />, scope: ["screen"] },
    { id: "export-all", label: t("action.export"), icon: <Download className="size-5" strokeWidth={2} />, scope: ["screen"] },
    { id: "create", label: t("action.create"), icon: <Plus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true },
    { id: "edit", label: t("action.edit"), icon: <Pencil className="size-5" strokeWidth={2} />, scope: ["single"] },
    { id: "duplicate", label: t("action.duplicate"), icon: <Copy className="size-5" strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
    { id: "export", label: t("action.export"), icon: <Upload className="size-5" strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
    { id: "close", label: t("action.close"), icon: <CheckCircle2 className="size-5" strokeWidth={2} />, scope: ["single", "bulk"], countInLabel: true },
    { id: "delete", label: t("action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["single", "bulk"], tone: "danger", countInLabel: true },
  ];
}

/** Un tono y un icono por métrica, en el orden del pulso. */
const METRIC_TONES = ["brand", "warning", "positive"] as const;
const METRIC_ICONS = ["analytics", "survey", "users"] as const;

/** La ficha de «ver más»: la puerta al catálogo, sin degradado ni insignia. */
function moreTemplates(t: (key: AppMessageKey) => string): TemplateDefinition {
  return {
    id: "ver-mas",
    label: t("home.seeMoreTemplates"),
    name: t("home.wholeCatalog"),
    description: t("home.wholeCatalogHint"),
    meta: t("home.wholeCatalog"),
    icon: Layers,
    tone: "neutral",
    items: [],
  };
}

/** El color de marca del tema para el anillo; se resuelve al montar. */
const ringColor = getChartTheme().color[0];

const formatPercent = (value: number) => `${value.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%`;
const formatDelta = (value: number) => `${value > 0 ? "+" : "−"}${Math.abs(value).toLocaleString("es-CO", { maximumFractionDigits: 1 })} pp`;

/**
 * El home, como plantilla.
 *
 * La estructura es la de una pantalla de gestión completa —de qué partir, cómo
 * va, qué necesita atención y la lista con todo— y está armada solo con piezas
 * del sistema: `KpiCard`, `AttentionStrip`, `ThemaTabs`, la tabla configurable
 * y la barra de acciones del shell. Los datos son los de `homeTemplate.tsx`,
 * deterministas y sin backend: para convertirla en una pantalla real se
 * sustituye ese módulo por la consulta que toque y el resto se queda igual.
 */
export function DashboardPage() {
  const t = useAppT();
  const { current, formatNumber } = useLocale();
  // Las cifras y las fechas siguen al idioma, no a una región escrita a mano.
  const formatCount = React.useCallback((value: number) => formatNumber(value), [formatNumber]);
  const actions = React.useMemo(() => railActions(t), [t]);
  const columns = React.useMemo(() => processColumns(t), [t]);
  const templates = React.useMemo(() => buildTemplates(t), [t]);
  const templateGroups = React.useMemo(() => buildTemplateGroups(t), [t]);
  const cells = React.useMemo(
    () => processCells(t, current.intl, formatCount),
    [t, current.intl, formatCount]
  );

  const [tab, setTab] = React.useState("procesos");
  const [alert, setAlert] = React.useState<AlertId | null>(null);
  /* `undefined` = cerrado; `null` = abierto en la galería; un id = abierto en
     esa plantilla. Así una ficha lleva a su detalle y «ver más» al catálogo. */
  const [catalogEntry, setCatalogEntry] = React.useState<string | null | undefined>(undefined);
  const setCatalog = (id: string | null) => setCatalogEntry(id);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  /* Lo decide quien mira, desde el panel de configuración de la tabla; la
     pantalla solo necesita saberlo para no repetir las acciones en el rail. */
  const [actionsPlacement, setActionsPlacement] = React.useState<TableActionsPlacement>("rail");
  const railOwnsActions = actionsPlacement === "rail";
  const clearSelection = () => setSelected(new Set());

  /* Solo el filtro por alerta: la búsqueda, las columnas, la paginación y la
     selección las opera `DataListBlock`. Aquí solo se decide qué filas entran. */
  const preset = ALERT_PRESETS.find((item) => item.id === alert);
  const filtered = React.useMemo(
    () => PROCESS_ROWS.filter((row) => !preset || preset.matches(row)),
    [preset]
  );

  const attention = PROCESS_ROWS.filter((row) => ALERT_PRESETS.some((item) => item.matches(row))).length;
  const calm = attention === 0;

  const pickAlert = (id: AlertId) => {
    setTab("procesos");
    setAlert((current) => (current === id ? null : id));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        La cabecera va en la pantalla, no en el header del shell: migas,
        título, una línea de contexto y sus acciones. El header de arriba no
        repite el nombre de la sección (ver docs/SCREEN_BUILD_RULES.md).
      */}
      {/* Las migas viven en el header del shell —el mismo sitio que en la
          documentación—, así que la cabecera de la pantalla se queda con el
          título, su contexto y sus acciones. */}
      <ShellHeaderSlot>
        <Breadcrumbs items={[t("nav.home")]} />
      </ShellHeaderSlot>

      {/* Las acciones de la pantalla viven donde diga el panel de la tabla: en
          la cabecera, o en la barra flotante. Nunca en los dos sitios — que es
          justo lo que hacía que «Exportar» apareciera dos veces. */}
      <PageHeader
        title={t("home.title")}
        description={t("home.description")}
        actions={
          railOwnsActions ? undefined : (
            <>
              <Button variant="outline">
                <Download /> Exportar
              </Button>
              <Button>
                <Plus /> Crear proceso
              </Button>
            </>
          )
        }
      />

      {/* Primero de qué partir, luego cómo va, luego qué necesita una mano:
          cada paso más estrecho que el anterior. */}
      <section aria-label={t("home.templatesAria")} className="mb-section shrink-0">
        <h2 className="mb-stack text-sm font-semibold text-text-secondary">{t("home.templates")}</h2>
        <div className="grid grid-cols-2 gap-stack sm:grid-cols-3 lg:grid-cols-6">
          {/* Cinco promovidas y la puerta al catálogo completan la fila de seis. */}
          {templates.slice(0, 5).map((template) => (
            <TemplateTile key={template.id} template={template} variant="compact" onClick={() => setCatalog(template.id)} />
          ))}
          <TemplateTile template={moreTemplates(t)} variant="compact" dashed onClick={() => setCatalog(null)} />
        </div>
      </section>

      <section aria-label={t("home.metricsAria")} className="mb-section shrink-0">
        <React.Suspense
          fallback={
            <div className="grid gap-stack lg:grid-cols-3">
              {PULSE_METRICS.map((metric) => (
                <Skeleton key={metric.id} className="h-[168px] rounded-2xl" />
              ))}
            </div>
          }
        >
          <div className="grid gap-stack lg:grid-cols-3">
            {PULSE_METRICS.map((metric, index) => {
              const delta = metric.value - metric.previous;
              return (
                <MetricCard
                  key={metric.id}
                  label={t(metric.labelKey)}
                  value={formatPercent(metric.value)}
                  delta={delta}
                  deltaLabel={formatDelta(delta)}
                  caption={t("metric.caption", { count: PROCESS_ROWS.length })}
                  hint={t(metric.hintKey)}
                  tone={METRIC_TONES[index]}
                  icon={METRIC_ICONS[index]}
                  chartPlacement={index === 1 ? "bottom" : "side"}
                  chart={
                    index === 0 ? (
                      <MetricRing value={metric.value} color={ringColor} ariaLabel={`${t(metric.labelKey)}: ${formatPercent(metric.value)}`} />
                    ) : index === 1 ? (
                      <SparklineChart data={[...metric.series]} height={44} />
                    ) : (
                      <MetricDial value={metric.value} ariaLabel={`${t(metric.labelKey)}: ${formatPercent(metric.value)}`} />
                    )
                  }
                />
              );
            })}
          </div>
        </React.Suspense>
      </section>

      {/* Las alertas filtran la lista, así que al pulsar una también traen
          adelante su pestaña si se estaba en la otra. */}
      <AttentionStrip
        className="mb-section shrink-0"
        label={t("alert.aria")}
        tone={calm ? "positive" : "warning"}
        icon={calm ? CheckCircle2 : TriangleAlert}
        title={calm ? t("alert.calmTitle") : t("alert.title", { count: attention })}
        detail={calm ? t("alert.calmDetail") : t("alert.detail")}
      >
        {ALERT_PRESETS.map((item) => {
          const count = PROCESS_ROWS.filter(item.matches).length;
          if (count === 0 && alert !== item.id) return null;
          return (
            <AttentionAction
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              hint={t(item.hintKey, { days: CLOSING_SOON_DAYS })}
              value={count}
              tone={item.tone}
              active={alert === item.id}
              onClick={() => pickAlert(item.id)}
            />
          );
        })}
      </AttentionStrip>

      {/* Sin `sticky` a propósito: la atmósfera de la página la pinta un ancestro
          que no hace scroll, así que una barra fija aquí tendría que ser opaca
          —y le abriría un rectángulo a la gradación— o translúcida, y entonces
          se leerían las filas pasando por detrás. Los tabs scrollean con su
          contenido y el degradado sigue de largo. */}
      <div className="shrink-0">
        <ThemaTabs
          className="mb-3"
          variant="page"
          fitContent
          tabs={[
            { id: "procesos", label: t("processes.tab"), icon: <Layers className="size-4" /> },
            { id: "sin-asignar", label: t("processes.unassignedTab"), icon: <UserPlus className="size-4" /> },
          ]}
          activeTabId={tab}
          onTabChange={setTab}
        />
      </div>

      {tab === "procesos" ? (
        <DataListBlock
          tableId="home-plantilla-procesos"
          title={t("processes.listTitle")}
          noun="procesos"
          rows={filtered}
          columns={columns}
          cells={cells}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${t(row.nameKey)} ${row.nameSuffix}`}
          searchBy={(row) => `${t(row.nameKey)} ${row.nameSuffix}`}
          pageSize={PAGE_SIZE}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          onActionsPlacementChange={setActionsPlacement}
          recordActions={actions}
          emptyState={
            <p className="py-6 text-center text-sm text-text-muted">
              {alert ? t("processes.emptyFiltered") : t("processes.empty")}
            </p>
          }
          /* La misma lista y la misma selección: solo cambia el dibujo. Se
             queda con lo que identifica cada proceso y su estado, que es lo
             que se busca cuando las columnas sobran. */
          renderListItem={(row, state) => (
            <ListItem
              leading={state.checkbox}
              title={`${t(row.nameKey)} ${row.nameSuffix}`}
              description={`${t(row.periodKey)} · ${formatRowDate(row.endOffset, current.intl)} · ${row.items}`}
              meta={
                <span className="flex items-center gap-inline">
                  <Progress value={Math.min(100, row.progress)} className="h-1.5 w-20" />
                  <span className="w-10 text-right tabular-nums">{row.progress}%</span>
                </span>
              }
              actions={
                <>
                  <StatusBadge status={row.status} label={t(STATUS_KEYS[row.status])} />
                  {state.menu}
                </>
              }
              selected={state.selected}
            />
          )}
        />
      ) : (
        <TableShell
          title={
            <>
              Sin asignar
              <Badge variant="neutral">6</Badge>
            </>
          }
          description={t("processes.unassignedDescription")}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("unassigned.person")}</TableHead>
                <TableHead>{t("unassigned.area")}</TableHead>
                <TableHead className="text-right">{t("unassigned.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["Renata Méndez", "Carlos Rojas", "Ana Torres", "Diego Salazar", "Valentina Ruiz", "Mateo Herrera"].map((name, index) => (
                <TableRow key={name}>
                  <TableCell className="font-medium text-text-primary">{name}</TableCell>
                  <TableCell className="text-text-secondary">{t((["area.product", "area.sales", "area.tech", "area.finance", "area.marketing", "area.people"] as const)[index])}</TableCell>
                  <TableCell className="text-right">
                    <Button size="xs" variant="outline">
                      {t("unassigned.assign")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      )}

      <TemplateCatalogDrawer
        open={catalogEntry !== undefined}
        onOpenChange={(open) => setCatalogEntry(open ? catalogEntry ?? null : undefined)}
        groups={templateGroups}
        initialTemplateId={catalogEntry}
        onUseTemplate={() => setCatalogEntry(undefined)}
        title={t("home.templatesDrawerTitle")}
        description={t("home.templatesDrawerDescription")}
      />

      {/* Con las acciones en la barra, la selección las *sustituye*: no se
          apilan las de la pantalla con las de las filas. Y las que solo tienen
          sentido sobre un registro se caen en cuanto hay más de uno marcado. */}
      {railOwnsActions && (
        <ShellRailSlot>
          <DataListActionRail
            selectedCount={selected.size}
            onClearSelection={clearSelection}
            actions={actions}
          />
        </ShellRailSlot>
      )}
    </div>
  );
}
