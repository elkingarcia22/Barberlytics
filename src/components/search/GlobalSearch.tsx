import * as React from "react";
import { ClipperIcon } from "@/components/ai-interaction";
import { Clock, CornerDownLeft, FileText, ListTree, Search, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { readSearchActions, type SearchActionItem } from "./searchActions";
import { pushRecent, readRecents, type SearchRecent } from "./searchRecents";

/** Un registro del producto: una vacante, una persona, un curso, un componente. */
export interface SearchObjectItem {
  id: string;
  title: string;
  /** Contexto que se lee tras el título, separado por puntos medios. */
  meta?: readonly string[];
  /** Términos por los que se encuentra pero que no se muestran: etiquetas, alias, un correo. */
  keywords?: readonly string[];
  icon?: React.ReactNode;
  /** Etiqueta de la acción a la derecha; "Abrir" si no se dice otra cosa. */
  actionLabel?: string;
  onSelect: () => void;
}

/** Un destino de la navegación, con su ruta completa para saber dónde cae. */
export interface SearchNavigateItem {
  id: string;
  /** `["Selección", "Vacantes"]` se lee «Selección › Vacantes». */
  path: readonly string[];
  icon?: React.ReactNode;
  actionLabel?: string;
  onSelect: () => void;
}

export type SearchScope = "all" | "actions" | "navigate" | "objects" | "ask";

export interface GlobalSearchProps {
  objects?: readonly SearchObjectItem[];
  navigate?: readonly SearchNavigateItem[];
  /** Habilita preguntar al agente con lo escrito; sin esto, no hay grupo de preguntas. */
  onAsk?: (question: string) => void;
  /** Una línea que explica qué hará la pregunta y dónde responde. */
  askHint?: string;
  /**
   * Preguntas que se ofrecen antes de escribir nada. Las de la pantalla en la
   * que se está: en el calendario, sobre la agenda; en clientes, sobre ellos.
   */
  askSuggestions?: readonly string[];
  /**
   * Acciones que se ofrecen siempre, además de las de la pantalla abierta, que
   * llegan solas (ver `usePublishSearchActions`).
   */
  actions?: readonly SearchActionItem[];
  /** La pantalla en la que se está («Calendario»); rotula sus acciones rápidas. */
  contextLabel?: string;
  /** Dónde se recuerdan las últimas búsquedas en el navegador; `null` para no recordarlas. */
  recentsKey?: string | null;
  /** Sobre qué se está buscando: la empresa activa, el espacio, el proyecto. */
  scope?: string;
  placeholder?: string;
  /** Texto del disparador en la cabecera. */
  triggerLabel?: string;
  /** Glifo del campo; la chispa de IA si no se pasa otro. */
  mark?: React.ReactNode;
  className?: string;
}

/** Sin tildes y en minúsculas: "seleccion" encuentra "Selección". */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Palabra a palabra, no la frase entera: «no me llega codigo» encuentra
 * «No me llega el código por SMS» aunque la frase no aparezca tal cual.
 * Cada palabra tiene que estar en algún campo; el orden no importa.
 */
function matches(haystack: readonly string[], needle: string): boolean {
  const words = fold(needle).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fold(haystack.join(" "));
  return words.every((word) => text.includes(word));
}

const SCOPE_LABELS: Readonly<Record<SearchScope, string>> = {
  all: "Todo",
  actions: "Acciones",
  navigate: "Ir a",
  objects: "Objetos",
  ask: "Preguntar",
};

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="font-sans text-[11px] text-text-secondary">{keys}</kbd>
      {label}
    </span>
  );
}

/**
 * La búsqueda general del producto.
 *
 * Un solo campo para las tres cosas que alguien quiere hacer cuando no sabe
 * dónde está algo: abrir un registro, ir a una pantalla o preguntar. Los tres
 * grupos salen del mismo índice que le pasa quien la monta —la aplicación sus
 * registros y su árbol de navegación, la documentación sus componentes y sus
 * fundamentos—, así que el componente no sabe nada del dominio.
 *
 * El filtrado se hace aquí y no en cmdk (`shouldFilter={false}`) porque las
 * pestañas de alcance y el recuento necesitan saber cuántos resultados hay en
 * cada grupo antes de pintarlos.
 */
const NO_ACTIONS: readonly SearchActionItem[] = [];
const NO_SUGGESTIONS: readonly string[] = [];
const DEFAULT_RECENTS_KEY = "thema.search.recents";
/** Con el campo vacío la pregunta sugerida es una invitación, no una lista. */
const MAX_SUGGESTIONS = 2;
/** Las primeras de la pantalla —van de más a menos peso—; el resto aparece al escribir. */
const MAX_HOME_ACTIONS = 4;

export function GlobalSearch({
  objects = [],
  navigate = [],
  onAsk,
  askHint,
  askSuggestions = NO_SUGGESTIONS,
  actions = NO_ACTIONS,
  contextLabel,
  recentsKey = DEFAULT_RECENTS_KEY,
  scope,
  placeholder,
  triggerLabel,
  mark,
  className,
}: GlobalSearchProps) {
  const t = useT();
  const searchLabel = placeholder ?? t("shell.search");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeScope, setActiveScope] = React.useState<SearchScope>("all");
  // Lo que depende del momento de abrir: qué ofrece la pantalla que hay debajo
  // y qué se buscó la última vez. Se toma entonces, no mientras está cerrada.
  const [screenActions, setScreenActions] = React.useState<readonly SearchActionItem[]>(NO_ACTIONS);
  const [recents, setRecents] = React.useState<readonly SearchRecent[]>([]);

  // Cada apertura empieza en limpio: abrir la búsqueda con los restos de la
  // anterior es desconcertante. Reiniciar también al cerrar no molesta, así
  // que no hace falta saber hacia dónde va el conmutador.
  const prepare = React.useCallback(() => {
    setQuery("");
    setActiveScope("all");
    setScreenActions(readSearchActions());
    setRecents(recentsKey ? readRecents(recentsKey) : []);
  }, [recentsKey]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        prepare();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prepare]);

  const trimmed = query.trim();
  const canAsk = Boolean(onAsk) && trimmed.length > 0;

  const foundObjects = React.useMemo(
    () => objects.filter((item) => matches([item.title, ...(item.meta ?? []), ...(item.keywords ?? [])], trimmed)),
    [objects, trimmed]
  );
  const foundNavigate = React.useMemo(
    () => navigate.filter((item) => matches(item.path, trimmed)),
    [navigate, trimmed]
  );

  // Las de la pantalla primero: son la razón de abrir la búsqueda desde ahí.
  const allActions = React.useMemo(() => [...screenActions, ...actions], [screenActions, actions]);
  const foundActions = React.useMemo(() => allActions.filter((item) => matches([item.label, item.hint ?? ""], trimmed)), [allActions, trimmed]);

  // Los recientes guardan solo el id: se pintan con lo que hoy diga el índice,
  // y uno que ya no exista —un registro borrado— simplemente no aparece.
  const recentRows = React.useMemo(
    () =>
      recents.flatMap((recent) => {
        if (recent.kind === "object") {
          const item = objects.find((candidate) => candidate.id === recent.id);
          return item ? [{ key: `object-${item.id}`, title: item.title, secondary: item.meta?.join(" · "), label: [item.title, ...(item.meta ?? [])].join(", "), action: item.actionLabel ?? "Abrir", recent, onSelect: item.onSelect }] : [];
        }
        const item = navigate.find((candidate) => candidate.id === recent.id);
        if (!item) return [];
        const title = item.path[item.path.length - 1] ?? "";
        return [{ key: `navigate-${item.id}`, title, secondary: item.path.slice(0, -1).join(" › "), label: item.path.join(", "), action: item.actionLabel ?? "Navegar", recent, onSelect: item.onSelect }];
      }),
    [recents, objects, navigate]
  );

  const suggestions = onAsk ? askSuggestions.slice(0, MAX_SUGGESTIONS) : NO_SUGGESTIONS;
  /*
   * Antes de escribir, la búsqueda no enseña el índice entero sino por dónde
   * empezar desde aquí: qué se puede hacer en esta pantalla, qué preguntar
   * sobre ella y lo último que se abrió. Si no hay nada de eso —la
   * documentación, una app sin acciones—, se queda el índice de siempre.
   */
  const isHome = trimmed.length === 0 && (allActions.length > 0 || suggestions.length > 0 || recentRows.length > 0);

  const scopes = React.useMemo<readonly SearchScope[]>(() => {
    const available: SearchScope[] = ["all"];
    if (allActions.length) available.push("actions");
    if (navigate.length) available.push("navigate");
    if (objects.length) available.push("objects");
    if (onAsk) available.push("ask");
    return available;
  }, [allActions.length, navigate.length, objects.length, onAsk]);

  const showAsk = canAsk && (activeScope === "all" || activeScope === "ask");
  const showObjects = foundObjects.length > 0 && (activeScope === "all" || activeScope === "objects");
  const showNavigate = foundNavigate.length > 0 && (activeScope === "all" || activeScope === "navigate");
  const showActions = foundActions.length > 0 && (activeScope === "all" || activeScope === "actions");
  const count = (showAsk ? 1 : 0) + (showActions ? foundActions.length : 0) + (showObjects ? foundObjects.length : 0) + (showNavigate ? foundNavigate.length : 0);

  const openSearch = () => {
    prepare();
    setOpen(true);
  };

  /** Abrir un resultado lo deja el primero de «Últimas búsquedas». */
  const closeAndRemember = (recent: SearchRecent, run: () => void) => {
    if (recentsKey) pushRecent(recentsKey, recent);
    close(run);
  };

  const close = (run: () => void) => {
    run();
    setOpen(false);
  };

  // El tabulador cambia de alcance en vez de sacar el foco del campo, que es
  // lo que anuncia la barra de atajos.
  const onCommandKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || scopes.length < 2 || isHome) return;
    event.preventDefault();
    const index = scopes.indexOf(activeScope);
    const next = event.shiftKey ? index - 1 + scopes.length : index + 1;
    setActiveScope(scopes[next % scopes.length]);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className={cn(
          "flex h-8 items-center gap-inline rounded-md border border-border/70 bg-surface px-2.5 text-[13px] text-text-muted transition-colors hover:bg-surface-muted hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          className
        )}
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">{triggerLabel ?? searchLabel}</span>
        <kbd className="ml-auto hidden rounded border border-border/70 bg-surface-muted px-1.5 font-sans text-[10px] font-semibold text-text-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[12%] w-[calc(100vw-2rem)] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">Búsqueda general</DialogTitle>
          <DialogDescription className="sr-only">
            Busca registros, navega a una pantalla o pregunta al agente.
          </DialogDescription>

          <Command shouldFilter={false} loop onKeyDown={onCommandKeyDown} className="rounded-none bg-transparent p-0">
            <div className="flex items-center gap-2.5 border-b border-border/60 px-3 py-2.5">
              {/* La marca dice de qué va esta búsqueda: con agente lleva el
                  gradiente de IA y su chispa; sin él, el de marca y la lupa. */}
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-card",
                  onAsk ? "bg-ai-gradient" : "bg-brand-gradient"
                )}
              >
                {mark ?? (onAsk ? <ClipperIcon className="size-4" /> : <Search className="size-4" strokeWidth={2.5} />)}
              </span>
              <div className="min-w-0 flex-1">
                <CommandInput value={query} onValueChange={setQuery} placeholder={searchLabel} />
              </div>
              <kbd className="hidden shrink-0 rounded border border-border/70 bg-surface-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold text-text-muted sm:inline">
                esc
              </kbd>
            </div>

            {!isHome && (
            <div className="flex items-center gap-1 border-b border-border/60 px-3 py-2">
              {scopes.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={activeScope === item}
                  onClick={() => setActiveScope(item)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                    activeScope === item
                      ? "bg-primary text-primary-foreground"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  )}
                >
                  {SCOPE_LABELS[item]}
                </button>
              ))}
              <span className="ml-auto shrink-0 text-[11px] text-text-muted">
                {count} {count === 1 ? "resultado" : "resultados"}
              </span>
            </div>
            )}

            <CommandList className="max-h-[min(60vh,26rem)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-text-muted">
              {isHome ? (
                <>
                  {allActions.length > 0 && (
                    <CommandGroup heading={contextLabel ? `Acciones rápidas · ${contextLabel}` : "Acciones rápidas"}>
                      {allActions.slice(0, MAX_HOME_ACTIONS).map((item) => (
                        <ActionRow key={item.id} item={item} onSelect={() => close(item.onSelect)} />
                      ))}
                    </CommandGroup>
                  )}

                  {suggestions.length > 0 && (
                    <CommandGroup heading="Preguntar al agente">
                      {suggestions.map((question) => (
                        <SearchRow
                          key={question}
                          value={`suggestion-${question}`}
                          icon={<AskTile />}
                          title={question}
                          secondary={askHint}
                          ariaLabel={`Preguntar al agente: ${question}`}
                          action="Preguntar"
                          onSelect={() => close(() => onAsk?.(question))}
                        />
                      ))}
                    </CommandGroup>
                  )}

                  {recentRows.length > 0 && (
                    <CommandGroup heading="Últimas búsquedas">
                      {recentRows.map((row) => (
                        <SearchRow
                          key={row.key}
                          value={`recent-${row.key}`}
                          icon={<Tile><Clock /></Tile>}
                          title={row.title}
                          secondary={row.secondary}
                          ariaLabel={row.label}
                          action={row.action}
                          onSelect={() => closeAndRemember(row.recent, row.onSelect)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                </>
              ) : (
                <>
                  {count === 0 && (
                    <CommandEmpty className="px-3 py-8 text-[13px] text-text-muted">
                      {trimmed ? `Nada que coincida con «${trimmed}».` : "Escribe para buscar."}
                    </CommandEmpty>
                  )}

                  {showAsk && (
                    <CommandGroup heading="Preguntar al agente">
                      <SearchRow
                        value={`ask-${trimmed}`}
                        icon={<AskTile />}
                        title={`«${trimmed}»`}
                        secondary={askHint}
                        ariaLabel={`Preguntar al agente: ${trimmed}`}
                        action="Preguntar"
                        onSelect={() => close(() => onAsk?.(trimmed))}
                      />
                    </CommandGroup>
                  )}

                  {showActions && (
                    <CommandGroup heading={contextLabel ? `Acciones · ${contextLabel}` : "Acciones"}>
                      {foundActions.map((item) => (
                        <ActionRow key={item.id} item={item} onSelect={() => close(item.onSelect)} />
                      ))}
                    </CommandGroup>
                  )}

                  {showObjects && (
                    <CommandGroup heading="Objetos">
                      {foundObjects.map((item) => (
                        <SearchRow
                          key={item.id}
                          value={`object-${item.id}`}
                          icon={<Tile>{item.icon ?? <FileText />}</Tile>}
                          title={item.title}
                          secondary={item.meta?.join(" · ")}
                          ariaLabel={[item.title, ...(item.meta ?? [])].join(", ")}
                          action={item.actionLabel ?? "Abrir"}
                          onSelect={() => closeAndRemember({ kind: "object", id: item.id }, item.onSelect)}
                        />
                      ))}
                    </CommandGroup>
                  )}

                  {showNavigate && (
                    <CommandGroup heading="Ir a">
                      {foundNavigate.map((item) => (
                        <SearchRow
                          key={item.id}
                          value={`navigate-${item.id}`}
                          icon={<Tile>{item.icon ?? <ListTree />}</Tile>}
                          title={item.path[item.path.length - 1] ?? ""}
                          secondary={item.path.slice(0, -1).join(" › ")}
                          ariaLabel={item.path.join(", ")}
                          action={item.actionLabel ?? "Navegar"}
                          onSelect={() => closeAndRemember({ kind: "navigate", id: item.id }, item.onSelect)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-3 py-2 text-[11px] text-text-muted">
              <Hint keys="↑↓" label="moverse" />
              <Hint keys="↵" label={onAsk ? "abrir o preguntar" : "abrir"} />
              {scopes.length > 1 && !isHome && <Hint keys="⇥" label="cambiar de grupo" />}
              {scope && (
                <span className="ml-auto">
                  Alcance: <span className="font-medium text-text-secondary">{scope}</span>
                </span>
              )}
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** El recuadro del icono: da a todas las filas el mismo arranque, traigan el icono que traigan. */
function Tile({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-text-secondary [&_svg]:size-4">
      {children}
    </span>
  );
}

function AskTile() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted [&_svg]:size-5">
      <ClipperIcon />
    </span>
  );
}

/** Una acción de la pantalla. Bloqueada sigue a la vista, apagada y con su motivo. */
function ActionRow({ item, onSelect }: { item: SearchActionItem; onSelect: () => void }) {
  const secondary = item.blockedReason ?? item.hint;
  return (
    <SearchRow
      value={`action-${item.id}`}
      icon={<Tile>{item.icon ?? <Zap />}</Tile>}
      title={item.label}
      secondary={secondary}
      ariaLabel={secondary ? `${item.label}, ${secondary}` : item.label}
      action="Ejecutar"
      disabled={Boolean(item.blockedReason)}
      onSelect={onSelect}
    />
  );
}

/**
 * Una fila de resultado: icono, título y, debajo, su contexto. La acción solo
 * se enseña en la fila activa: diez «Abrir» apilados no dicen nada, y uno al
 * lado de lo que se va a abrir sí.
 */
function SearchRow({
  value,
  icon,
  title,
  secondary,
  action,
  ariaLabel,
  disabled,
  onSelect,
}: {
  value: string;
  icon?: React.ReactNode;
  title: string;
  /** La segunda línea: el contexto, la ruta o qué pasa al elegirla. */
  secondary?: string;
  action?: string;
  /**
   * Etiqueta explícita: los «·» y «›» que separan las partes son decorativos,
   * así que sin esto un lector de pantalla leía "Analista de datosvacante"
   * todo junto. Con comas hace las pausas donde toca.
   */
  ariaLabel: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={value} aria-label={ariaLabel} disabled={disabled} onSelect={onSelect} className="mx-1 items-center gap-3 px-2 py-2">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-text-primary">{title}</span>
        {secondary && <span className="block truncate text-[12.5px] leading-snug text-text-secondary">{secondary}</span>}
      </span>
      {action && (
        <CommandShortcut className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium tracking-normal opacity-0 group-data-selected/command-item:opacity-100">
          {action}
          <kbd className="grid h-5 w-6 place-items-center rounded-md border border-border/70 bg-surface">
            <CornerDownLeft className="size-3" />
          </kbd>
        </CommandShortcut>
      )}
    </CommandItem>
  );
}
