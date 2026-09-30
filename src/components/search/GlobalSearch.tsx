import * as React from "react";
import { CornerDownLeft, FileText, ListTree, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";

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

export type SearchScope = "all" | "navigate" | "objects" | "ask";

export interface GlobalSearchProps {
  objects?: readonly SearchObjectItem[];
  navigate?: readonly SearchNavigateItem[];
  /** Habilita preguntar al agente con lo escrito; sin esto, no hay grupo de preguntas. */
  onAsk?: (question: string) => void;
  /** Una línea que explica qué hará la pregunta y dónde responde. */
  askHint?: string;
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
export function GlobalSearch({
  objects = [],
  navigate = [],
  onAsk,
  askHint,
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

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Cada apertura empieza en limpio: abrir la búsqueda con los restos de
        // la anterior es desconcertante. Reiniciar también al cerrar no
        // molesta, así que no hace falta saber hacia dónde va el conmutador.
        setQuery("");
        setActiveScope("all");
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const scopes = React.useMemo<readonly SearchScope[]>(() => {
    const available: SearchScope[] = ["all"];
    if (navigate.length) available.push("navigate");
    if (objects.length) available.push("objects");
    if (onAsk) available.push("ask");
    return available;
  }, [navigate.length, objects.length, onAsk]);

  const showAsk = canAsk && (activeScope === "all" || activeScope === "ask");
  const showObjects = foundObjects.length > 0 && (activeScope === "all" || activeScope === "objects");
  const showNavigate = foundNavigate.length > 0 && (activeScope === "all" || activeScope === "navigate");
  const count = (showAsk ? 1 : 0) + (showObjects ? foundObjects.length : 0) + (showNavigate ? foundNavigate.length : 0);

  const openSearch = () => {
    setQuery("");
    setActiveScope("all");
    setOpen(true);
  };

  const close = (run: () => void) => {
    run();
    setOpen(false);
  };

  // El tabulador cambia de alcance en vez de sacar el foco del campo, que es
  // lo que anuncia la barra de atajos.
  const onCommandKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || scopes.length < 2) return;
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
        <kbd className="ml-1 hidden rounded border border-border/70 bg-surface-muted px-1.5 font-sans text-[10px] font-semibold text-text-muted sm:inline">
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
                {mark ?? (onAsk ? <Sparkles className="size-4" strokeWidth={2.5} /> : <Search className="size-4" strokeWidth={2.5} />)}
              </span>
              <div className="min-w-0 flex-1">
                <CommandInput value={query} onValueChange={setQuery} placeholder={searchLabel} />
              </div>
              <kbd className="hidden shrink-0 rounded border border-border/70 bg-surface-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold text-text-muted sm:inline">
                esc
              </kbd>
            </div>

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

            <CommandList className="max-h-[min(60vh,26rem)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-text-muted">
              {count === 0 && (
                <CommandEmpty className="px-3 py-8 text-[13px] text-text-muted">
                  {trimmed ? `Nada que coincida con «${trimmed}».` : "Escribe para buscar."}
                </CommandEmpty>
              )}

              {showAsk && (
                <CommandGroup heading="Preguntar al agente">
                  <SearchRow
                    value={`ask-${trimmed}`}
                    icon={
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ai-gradient text-white">
                        <Sparkles className="size-3.5" strokeWidth={2.5} />
                      </span>
                    }
                    title={`«${trimmed}»`}
                    description={askHint}
                    ariaLabel={`Preguntar al agente: ${trimmed}`}
                    action={<CornerDownLeft className="size-3.5" />}
                    onSelect={() => close(() => onAsk?.(trimmed))}
                  />
                </CommandGroup>
              )}

              {showObjects && (
                <CommandGroup heading="Objetos">
                  {foundObjects.map((item) => (
                    <SearchRow
                      key={item.id}
                      value={`object-${item.id}`}
                      icon={item.icon ?? <FileText className="mt-0.5 size-4 shrink-0 text-text-muted" />}
                      title={item.title}
                      meta={item.meta}
                      action={item.actionLabel ?? "Abrir"}
                      onSelect={() => close(item.onSelect)}
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
                      icon={item.icon ?? <ListTree className="mt-0.5 size-4 shrink-0 text-text-muted" />}
                      title={item.path[item.path.length - 1] ?? ""}
                      breadcrumb={item.path.slice(0, -1)}
                      action={item.actionLabel ?? "Navegar"}
                      onSelect={() => close(item.onSelect)}
                    />
                  ))}
                </CommandGroup>
              )}
            </CommandList>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-3 py-2 text-[11px] text-text-muted">
              <Hint keys="↑↓" label="moverse" />
              <Hint keys="↵" label={onAsk ? "abrir o preguntar" : "abrir"} />
              {scopes.length > 1 && <Hint keys="⇥" label="cambiar de grupo" />}
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

/** Una fila de resultado: icono, título con su contexto y la acción a la derecha. */
function SearchRow({
  value,
  icon,
  title,
  meta,
  breadcrumb,
  description,
  action,
  ariaLabel,
  onSelect,
}: {
  value: string;
  icon?: React.ReactNode;
  title: string;
  meta?: readonly string[];
  breadcrumb?: readonly string[];
  description?: string;
  action?: React.ReactNode;
  ariaLabel?: string;
  onSelect: () => void;
}) {
  /*
   * Etiqueta explícita: los «·» y «›» que separan las partes son decorativos,
   * así que sin esto un lector de pantalla leía "Analista de datosvacante"
   * todo junto. Con comas hace las pausas donde toca.
   */
  const label = ariaLabel ?? [...(breadcrumb ?? []), title, ...(meta ?? [])].join(", ");
  return (
    <CommandItem
      value={value}
      aria-label={label}
      onSelect={onSelect}
      className="mx-1 items-start gap-2.5 px-2.5 py-2 data-[selected=true]:before:absolute data-[selected=true]:before:inset-y-1 data-[selected=true]:before:left-0 data-[selected=true]:before:w-[3px] data-[selected=true]:before:rounded-full data-[selected=true]:before:bg-primary"
    >
      {icon}
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="flex min-w-0 items-baseline gap-x-1.5 whitespace-nowrap text-[13px]">
          {breadcrumb?.map((step) => (
            <React.Fragment key={step}>
              <span className="text-text-secondary">{step}</span>
              <span aria-hidden className="text-text-muted">
                ›
              </span>
            </React.Fragment>
          ))}
          <span className="shrink-0 font-semibold text-text-primary">{title}</span>
          {meta?.map((entry) => (
            <React.Fragment key={entry}>
              <span aria-hidden className="text-text-muted">
                ·
              </span>
              <span className="text-text-secondary">{entry}</span>
            </React.Fragment>
          ))}
        </span>
        {description && <span className="mt-0.5 block text-[11.5px] leading-snug text-text-muted">{description}</span>}
      </span>
      {action && <CommandShortcut className="shrink-0 self-center tracking-normal">{action}</CommandShortcut>}
    </CommandItem>
  );
}
