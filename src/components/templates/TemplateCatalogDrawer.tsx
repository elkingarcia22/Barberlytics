import * as React from "react";
import { ArrowLeft, LayoutGrid, Rows3, Search, SearchX, Sparkles, Target, X } from "lucide-react";
import { DrawerShell } from "@/components/overlays";
import { EmptyState } from "@/components/feedback";
import { SegmentedControl } from "@/components/selection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toneBar, toneBorder, toneChip, toneGradient } from "@/lib/tone";
import { TemplateStage, TemplateThumb, TemplateTile } from "./TemplateTile";
import {
  featuredTemplate,
  findTemplate,
  matchesTemplateQuery,
  suggestTemplates,
  type TemplateDefinition,
  type TemplateGroup,
} from "./templateTypes";

/**
 * El catálogo de plantillas en un panel: una galería por estantes con
 * buscador, y un paso más adentro la plantilla misma con las líneas que trae
 * escritas y una fila de alternativas debajo.
 *
 * Las mismas fichas que van en la página van aquí dentro, en su variante
 * alta: una plantilla que alguien reconoció en la estantería es la que
 * reconoce al abrir el catálogo, y comparar nunca obliga a salirse.
 */

const SUGGESTION_LIMIT = 3;

export interface TemplateCatalogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** El catálogo, por estantes. Un solo estante se dibuja sin su cabecera. */
  groups: readonly TemplateGroup[];
  /** Adelante con la plantilla — qué signifique «usarla» lo decide quien
   *  monta el panel. */
  onUseTemplate: (template: TemplateDefinition) => void;
  /**
   * Abre directamente en la ficha de esta plantilla en vez de en la galería.
   * Se vuelve a leer en cada apertura, para que un atajo de fuera caiga en la
   * que señala y un «ver todo» reciba la galería.
   */
  initialTemplateId?: string | null;
  title?: string;
  description?: string;
}

export function TemplateCatalogDrawer({
  open,
  onOpenChange,
  groups,
  onUseTemplate,
  initialTemplateId,
  title = "Empieza con una plantilla",
  description = "Explora el catálogo por categoría, abre una para ver lo que trae y úsala como punto de partida.",
}: TemplateCatalogDrawerProps) {
  // El cuerpo se remonta en cada apertura, así que puede tener su propio
  // estado —dónde está, qué se busca— arrancando de las props cada vez, sin
  // efectos sincronizando nada. El contador sube comparando la prop con la
  // que vio el render anterior, que es algo que React resuelve antes de pintar.
  const [session, setSession] = React.useState({ open, count: 0 });
  if (session.open !== open) {
    setSession({ open, count: open ? session.count + 1 : session.count });
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="6xl"
      disablePadding
      // El scroll vive dentro de cada vista, así que el contenedor del drawer
      // nunca desborda y no hay franja que reservar.
      disableScrollbarGutter
      className="gap-0 p-0"
    >
      <CatalogBody
        key={session.count}
        groups={groups}
        initialTemplateId={initialTemplateId}
        onUseTemplate={onUseTemplate}
      />
    </DrawerShell>
  );
}

/** Dónde está el panel: recorriendo el catálogo o leyendo una plantilla. */
type CatalogView = { kind: "gallery" } | { kind: "detail"; templateId: string };

const GALLERY_VIEW: CatalogView = { kind: "gallery" };

function CatalogBody({
  groups,
  initialTemplateId,
  onUseTemplate,
}: {
  groups: readonly TemplateGroup[];
  initialTemplateId?: string | null;
  onUseTemplate: (template: TemplateDefinition) => void;
}) {
  const [view, setView] = React.useState<CatalogView>(() => {
    const initial = findTemplate(groups, initialTemplateId);
    return initial ? { kind: "detail", templateId: initial.id } : GALLERY_VIEW;
  });
  const [query, setQuery] = React.useState("");
  // La primera vista llega mientras el panel todavía está entrando, así que
  // necesita el retardo de `cascade-enter-drawer`; una vista alcanzada
  // tocando no espera a nada y usa la cascada inmediata (la retardada dejaría
  // el panel en blanco un instante en cada cambio, que se lee como un fallo).
  const [hasNavigated, setHasNavigated] = React.useState(false);

  const navigate = (next: CatalogView) => {
    setView(next);
    setHasNavigated(true);
  };

  const open = view.kind === "gallery" ? undefined : findTemplate(groups, view.templateId);
  const cascadeClassName = hasNavigated ? "cascade-enter" : "cascade-enter-drawer";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background p-4">
      {open === undefined ? (
        <TemplateGallery
          groups={groups}
          query={query}
          onQueryChange={setQuery}
          onOpenTemplate={(template) => navigate({ kind: "detail", templateId: template.id })}
          onUseTemplate={onUseTemplate}
          cascadeClassName={cascadeClassName}
        />
      ) : (
        <TemplateDetail
          key={open.id}
          groups={groups}
          template={open}
          onBack={() => navigate(GALLERY_VIEW)}
          onUseTemplate={() => onUseTemplate(open)}
          onOpenTemplate={(template) => navigate({ kind: "detail", templateId: template.id })}
          cascadeClassName={cascadeClassName}
        />
      )}
    </div>
  );
}

/** Rejilla de tarjetas con portada, o filas densas a todo lo ancho. */
type GalleryLayout = "card" | "row";

const LAYOUT_OPTIONS = [
  { value: "card", label: "Tarjetas", icon: LayoutGrid },
  { value: "row", label: "Lista", icon: Rows3 },
];

function TemplateGallery({
  groups,
  query,
  onQueryChange,
  onOpenTemplate,
  onUseTemplate,
  cascadeClassName,
}: {
  groups: readonly TemplateGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  onOpenTemplate: (template: TemplateDefinition) => void;
  onUseTemplate: (template: TemplateDefinition) => void;
  cascadeClassName: string;
}) {
  const [layout, setLayout] = React.useState<GalleryLayout>("card");
  const isSearching = query.trim().length > 0;
  const featured = featuredTemplate(groups);
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      templates: group.templates.filter((template) => matchesTemplateQuery(template, query)),
    }))
    .filter((group) => group.templates.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-inline px-1 pb-4">
        <SegmentedControl
          options={LAYOUT_OPTIONS}
          value={layout}
          onChange={(value) => setLayout(value as GalleryLayout)}
          size="sm"
          ariaLabel="Tipo de vista"
        />
        <div className="relative w-full sm:w-[280px]">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          />
          <Input
            aria-label="Buscar plantilla"
            placeholder="Buscar por nombre o contenido…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-9 pr-8"
          />
          {isSearching && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleGroups.length > 0 ? (
          <div className={cn("flex flex-col gap-7 pb-2", cascadeClassName)}>
            {/* La destacada se aparta mientras se busca: una búsqueda ya es una
                respuesta a «¿por dónde empiezo?». */}
            {!isSearching && featured && (
              <FeaturedTemplateCard
                template={featured}
                onOpen={() => onOpenTemplate(featured)}
                onUse={() => onUseTemplate(featured)}
              />
            )}
            {visibleGroups.map((group) => (
              <TemplateShelf
                key={group.id}
                group={group}
                layout={layout}
                withHeader={groups.length > 1}
                onOpenTemplate={onOpenTemplate}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title={`No encontramos plantillas para «${query.trim()}»`}
            description="Prueba con otra palabra o vuelve a ver todo el catálogo."
            action={
              <Button variant="outline" onClick={() => onQueryChange("")}>
                Ver todas las plantillas
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

/**
 * La plantilla por la que empezar, estirada a lo ancho: la misma miniatura que
 * su ficha sobre una portada más ancha, por qué es la elegida y las dos
 * salidas —leerla antes, o usarla ya—.
 */
function FeaturedTemplateCard({
  template,
  onOpen,
  onUse,
}: {
  template: TemplateDefinition;
  onOpen: () => void;
  onUse: () => void;
}) {
  return (
    <article
      aria-label={`Recomendada: ${template.name}`}
      className="group relative flex items-stretch gap-stack overflow-hidden rounded-2xl border border-border/60 bg-surface p-3 shadow-card magic-card-sweep"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver la plantilla ${template.name}`}
        className="z-[1] shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <TemplateStage template={template} className="h-full w-[188px]">
          <TemplateThumb template={template} size="lg" className="mb-0 mr-0" />
        </TemplateStage>
      </button>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-1.5">
        <Badge variant="info" className="w-fit gap-1">
          <Sparkles className="size-3" strokeWidth={2.25} aria-hidden />
          Recomendada para empezar
        </Badge>
        <h3 className="text-base font-bold leading-tight tracking-tight text-text-primary">
          {template.name}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
          {template.pitch ?? template.description}
        </p>
        <p className="text-[11px] font-medium text-text-muted">{template.meta}</p>
      </div>

      <div className="relative z-[1] flex shrink-0 flex-col justify-center gap-inline pr-2">
        <Button onClick={onUse}>Usar plantilla</Button>
        <Button variant="outline" onClick={onOpen}>
          Ver contenido
        </Button>
      </div>
    </article>
  );
}

function TemplateShelf({
  group,
  layout,
  withHeader,
  onOpenTemplate,
}: {
  group: TemplateGroup;
  layout: GalleryLayout;
  withHeader: boolean;
  onOpenTemplate: (template: TemplateDefinition) => void;
}) {
  const Icon = group.icon;
  const headingId = `estante-${group.id}`;

  return (
    <section aria-labelledby={withHeader ? headingId : undefined} aria-label={withHeader ? undefined : group.label}>
      {withHeader && (
        <div className="mb-3 flex items-center gap-stack px-1">
          {Icon && (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-secondary ring-1 ring-inset ring-border/40">
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-inline">
              <h3 id={headingId} className="text-[13.5px] font-semibold leading-tight text-text-primary">
                {group.label}
              </h3>
              <span className="text-[11px] font-semibold tabular-nums text-text-muted">
                {group.templates.length}
              </span>
            </div>
            {group.description && (
              <p className="mt-0.5 truncate text-xs text-text-muted">{group.description}</p>
            )}
          </div>
        </div>
      )}

      <div
        className={
          layout === "card"
            ? "grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-4"
            : "flex flex-col gap-2"
        }
      >
        {group.templates.map((template) => (
          <TemplateTile
            key={template.id}
            template={template}
            variant={layout}
            onClick={() => onOpenTemplate(template)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Una plantilla, abierta: la vuelta a la galería, su cabecera —con la misma
 * miniatura que tenía la ficha, para que las dos se lean como un solo
 * objeto—, para qué sirve, las líneas que trae con su peso, y debajo una fila
 * corta de alternativas en el mismo estilo de ficha.
 */
function TemplateDetail({
  groups,
  template,
  onBack,
  onUseTemplate,
  onOpenTemplate,
  cascadeClassName,
}: {
  groups: readonly TemplateGroup[];
  template: TemplateDefinition;
  onBack: () => void;
  onUseTemplate: () => void;
  onOpenTemplate: (template: TemplateDefinition) => void;
  cascadeClassName: string;
}) {
  const suggestions = suggestTemplates(groups, template, SUGGESTION_LIMIT);
  const maxWeight = Math.max(...template.items.map((item) => item.weight), 0);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-stack", cascadeClassName)}>
      <nav aria-label="Ubicación de la plantilla" className="flex shrink-0 items-center px-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Todas las plantillas
        </Button>
      </nav>

      <header
        className="shrink-0 overflow-hidden rounded-2xl border border-border/60 p-card shadow-card"
        style={toneGradient(template.tone, { alpha: 10, light: "sweep" })}
      >
        <div className="flex items-start justify-between gap-stack">
          <div className="flex min-w-0 flex-1 items-center gap-stack">
            <TemplateThumb template={template} size="md" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-snug tracking-tight text-text-primary">
                {template.name}
              </h2>
              <p className="mt-0.5 text-[11px] font-medium text-text-muted">{template.meta}</p>
            </div>
          </div>
          <Button onClick={onUseTemplate} className="shrink-0">
            Usar plantilla
          </Button>
        </div>

        {/* Para qué sirve es lo que decide si la plantilla vale, así que se lee
            como una cita destacada, con su propio filete. */}
        <div className="mt-4 border-l-2 pl-3.5" style={toneBorder(template.tone, 45)}>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <Target className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Para qué sirve
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">
            {template.description}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6 pb-2">
          <section aria-label="Contenido de la plantilla" className="flex flex-col gap-2">
            {template.items.map((item, index) => (
              <article
                key={item.label}
                className="flex items-center gap-stack rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-card"
              >
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums"
                  style={toneChip(template.tone)}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight text-text-primary">
                    {item.label}
                  </p>
                  {item.hint && (
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{item.hint}</p>
                  )}
                </div>
                {/* El peso, dibujado: la barra es la misma que la miniatura
                    enseña en pequeño, así que la ficha confirma lo que la
                    portada ya insinuaba. */}
                <span className="flex shrink-0 items-center gap-inline">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border sm:w-24">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${maxWeight > 0 ? (item.weight / maxWeight) * 100 : 100}%`,
                        ...toneBar(template.tone),
                      }}
                    />
                  </span>
                  <span className="w-10 text-right text-[11px] font-semibold tabular-nums text-text-secondary">
                    {item.weight}
                  </span>
                </span>
              </article>
            ))}
          </section>

          {suggestions.length > 0 && (
            <section aria-label="Otras plantillas" className="flex flex-col gap-stack">
              <h3 className="px-1 text-[13px] font-semibold text-text-secondary">
                Otras que te pueden servir
              </h3>
              <div className="grid grid-cols-1 gap-stack sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <TemplateTile
                    key={suggestion.id}
                    template={suggestion}
                    variant="card"
                    onClick={() => onOpenTemplate(suggestion)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
