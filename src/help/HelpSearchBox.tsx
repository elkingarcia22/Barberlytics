import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ArrowUp, CornerDownLeft, FileText, Loader2, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { MovingBorderBeam } from "@/components/ui/moving-border-beam";
import { AiSparkGlyph } from "@/components/ai-interaction/AiSparkGlyph";
import { Kbd } from "@/components/ui/kbd";
import { Text } from "@/components/typography";
import { useAppT } from "@/app/i18n";
import { searchHelpDetailed, type HelpSearchHit } from "@/lib/help";
import { helpPath, useHelpIndex, useHelpSearchDocs } from "./content";
import { Highlight } from "./Highlight";

interface HelpSearchBoxProps {
  initialQuery?: string;
  /** Grande, para la portada; el normal es para la página de resultados. */
  size?: "hero" | "default";
  autoFocus?: boolean;
  /** Búsquedas frecuentes que se ofrecen como chips mientras el campo está vacío. */
  suggestions?: readonly string[];
  className?: string;
}

const LIVE_LIMIT = 6;
const MIN_QUERY = 2;

/**
 * El buscador del centro de ayuda. Mientras se escribe enseña los mejores
 * artículos debajo con las coincidencias marcadas, se recorre con las
 * flechas y Enter abre el elegido (o, sin elegir, la página de resultados).
 * El índice de búsqueda se pide al tocar el campo, para que la primera letra
 * ya tenga respuesta. Quien lo monte con otra consulta inicial le cambia la
 * `key`: el campo no se sincroniza solo.
 */
export function HelpSearchBox({ initialQuery = "", size = "default", autoFocus, suggestions, className }: HelpSearchBoxProps) {
  const t = useAppT();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(initialQuery);
  const [isFocused, setIsFocused] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const trimmed = query.trim();
  const isSearching = trimmed.length >= MIN_QUERY;
  const { data: index } = useHelpIndex();
  const docs = useHelpSearchDocs(isFocused || isSearching);
  const listId = React.useId();
  const isHero = size === "hero";

  const result = React.useMemo(
    () => (docs.data && isSearching ? searchHelpDetailed(docs.data, query, { limit: LIVE_LIMIT, typing: true }) : { hits: [], corrections: [] }),
    [docs.data, isSearching, query]
  );
  const hits = result.hits;
  const isOpen = isFocused && isSearching;
  const isLoading = isOpen && docs.isPending;
  // La fila de «ver todos» es la última opción del teclado.
  const optionCount = hits.length + 1;

  const goToResults = () => {
    if (!trimmed) return;
    setIsFocused(false);
    navigate(`${helpPath()}/buscar?q=${encodeURIComponent(trimmed)}`);
  };
  const openHit = (hit: HelpSearchHit) => {
    setIsFocused(false);
    navigate(helpPath(hit.id));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % optionCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? optionCount - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && activeIndex < hits.length) {
      event.preventDefault();
      openHit(hits[activeIndex]);
    } else if (event.key === "Escape") {
      setIsFocused(false);
    }
  };

  const sectionTitle = (id: string) => index?.sections.find((section) => section.id === id)?.title ?? id;
  const optionId = (position: number) => `${listId}-${position}`;

  return (
    <div className={cn("relative", className)}>
      {/* La caja es la del Agente IA: superficie redondeada, la luz que
          recorre el borde en los colores de IA, la chispa a la izquierda y el
          botón redondo en gradiente. Buscar aquí es la primera versión de
          preguntarle al asistente, así que se presenta como tal. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          goToResults();
        }}
        role="search"
        className={cn(
          "relative z-0 flex items-center gap-2 bg-surface shadow-card transition-shadow focus-within:shadow-lg",
          isHero ? "rounded-[22px] p-2 pl-4" : "rounded-2xl p-1.5 pl-3.5"
        )}
      >
        <MovingBorderBeam duration={6000} borderWidth={1.5} rx={isHero ? 22 : 16} ry={isHero ? 22 : 16} />
        <AiSparkGlyph size={isHero ? 22 : 18} className="relative z-10 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={t("help.searchPlaceholder")}
          aria-label={t("help.searchTitle")}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          autoComplete="off"
          className={cn(
            "relative z-10 min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden",
            isHero ? "h-11 text-base" : "h-9 text-sm"
          )}
          data-testid="help-search-input"
        />
        <button
          type="submit"
          aria-label={t("help.searchButton")}
          title={t("help.searchButton")}
          className={cn(
            "relative z-10 flex shrink-0 items-center justify-center gap-2 rounded-full bg-ai-gradient font-semibold text-text-inverse shadow-ai-premium transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            isHero ? "h-11 px-5 text-sm" : "size-9"
          )}
        >
          {isHero && <span>{t("help.searchButton")}</span>}
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </button>
      </form>

      {suggestions && suggestions.length > 0 && !trimmed && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label={t("help.popularSearches")}>
          <span className="text-xs text-text-muted">{t("help.popularSearches")}</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => navigate(`${helpPath()}/buscar?q=${encodeURIComponent(suggestion)}`)}
              className="rounded-full border border-border/70 bg-surface px-3 py-1 text-xs font-medium text-text-secondary transition-all hover:-translate-y-0.5 hover:border-ai-border hover:text-text-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="absolute inset-x-0 top-full z-popover mt-2 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-lg"
          onMouseDown={(event) => event.preventDefault()}
        >
          {result.corrections.length > 0 && (
            <p className="border-b border-border/60 bg-surface-subtle px-4 py-2 text-xs text-text-secondary">
              {t("help.showingFor", { query: result.corrections.reduce((text, fix) => text.replace(new RegExp(fix.from, "i"), fix.to), trimmed) })}
            </p>
          )}
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-text-muted">
              <Loader2 className="size-4 animate-spin" />
              {t("help.searching")}
            </div>
          ) : hits.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary">
              <SearchX className="size-4 shrink-0 text-text-muted" />
              <span>
                {t("help.noResults", { query: trimmed })}. {t("help.noResultsHint")}
              </span>
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label={t("help.searchTitle")}>
              {hits.map((hit, position) => {
                const article = index?.articles[hit.id];
                if (!article) return null;
                const isActive = position === activeIndex;
                return (
                  <li key={hit.id} id={optionId(position)} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => openHit(hit)}
                      onMouseEnter={() => setActiveIndex(position)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none",
                        isActive ? "bg-primary/5" : "hover:bg-surface-subtle"
                      )}
                    >
                      <FileText className={cn("mt-0.5 size-4 shrink-0", isActive ? "text-primary" : "text-text-muted")} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-medium text-text-primary">
                          <Highlight text={article.title} terms={hit.matched} />
                        </span>
                        <span className="line-clamp-1 text-xs text-text-secondary">
                          <Highlight text={hit.snippet || article.description} terms={hit.matched} />
                        </span>
                        <Text as="span" size="xs" tone="muted">{sectionTitle(article.section)}</Text>
                      </span>
                      {isActive && <CornerDownLeft className="mt-1 size-3.5 shrink-0 text-text-muted" />}
                    </button>
                  </li>
                );
              })}
              <li id={optionId(hits.length)} role="option" aria-selected={activeIndex === hits.length}>
                <button
                  type="button"
                  onClick={goToResults}
                  onMouseEnter={() => setActiveIndex(hits.length)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5 text-left text-sm font-medium text-primary transition-colors",
                    activeIndex === hits.length ? "bg-primary/5" : "hover:bg-surface-subtle"
                  )}
                >
                  <span>{t("help.seeAllResults", { query: trimmed })}</span>
                  <ArrowRight className="size-4" />
                </button>
              </li>
            </ul>
          )}
          {!isLoading && hits.length > 0 && (
            <div className="flex items-center gap-3 border-t border-border/60 bg-surface-subtle px-4 py-1.5 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1">
                <Kbd size="sm">↑</Kbd>
                <Kbd size="sm">↓</Kbd> {t("help.keyNavigate")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd size="sm">Enter</Kbd> {t("help.keyOpen")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd size="sm">Esc</Kbd> {t("help.keyClose")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
