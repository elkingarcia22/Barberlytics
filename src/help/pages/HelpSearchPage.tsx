import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Clock, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { HelpPage } from "../HelpPage";
import { Heading, Text } from "@/components/typography";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/utility";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { QueryBoundary } from "@/lib/query";
import { useAppT } from "@/app/i18n";
import { searchHelpDetailed, type HelpIndex, type HelpSearchDoc, type HelpSearchHit } from "@/lib/help";
import { helpPath, useHelpIndex, useHelpSearchDocs } from "../content";
import { HelpSearchBox } from "../HelpSearchBox";
import { Highlight } from "../Highlight";

const RESULT_LIMIT = 30;
/** El primero se destaca como «la mejor respuesta» solo si le saca esta ventaja al segundo. */
const BEST_ANSWER_MARGIN = 1.15;

function ResultRow({ hit, index, onOpen, highlighted }: { hit: HelpSearchHit; index: HelpIndex; onOpen: (id: string) => void; highlighted?: boolean }) {
  const t = useAppT();
  const article = index.articles[hit.id];
  if (!article) return null;
  const sectionTitle = index.sections.find((section) => section.id === article.section)?.title ?? article.section;
  return (
    <ListItem
      className={cn(highlighted && "border-primary/40 ring-1 ring-primary/20")}
      leading={highlighted ? <Sparkles className="size-4 shrink-0 text-primary" /> : <FileText className="size-4 shrink-0 text-text-muted" />}
      title={
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Highlight text={article.title} terms={hit.matched} />
          <Text as="span" size="xs" tone="muted">{sectionTitle}</Text>
        </span>
      }
      description={<Highlight text={hit.snippet || article.description} terms={hit.matched} />}
      meta={
        <span className="hidden items-center gap-1 whitespace-nowrap text-xs text-text-muted sm:inline-flex">
          <Clock className="size-3.5" />
          {t("help.readingMinutes", { count: article.readingMinutes })}
        </span>
      }
      onClick={() => onOpen(hit.id)}
    />
  );
}

function Results({ index, docs, query }: { index: HelpIndex; docs: HelpSearchDoc[]; query: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const { hits, corrections } = React.useMemo(() => searchHelpDetailed(docs, query, { limit: RESULT_LIMIT }), [docs, query]);

  if (!hits.length) {
    return (
      <EmptyState
        icon="search"
        title={t("help.noResults", { query })}
        description={t("help.noResultsHint")}
        action={
          <Button type="button" variant="outline" onClick={() => navigate(helpPath())}>
            {t("help.backHome")}
          </Button>
        }
      />
    );
  }

  const corrected = corrections.reduce((text, fix) => text.replace(new RegExp(fix.from, "i"), fix.to), query);
  const open = (id: string) => navigate(helpPath(id));

  // Por relevancia, sin agrupar: el mejor artículo va primero venga de la sección que venga.
  const [first, second] = hits;
  const hasBestAnswer = hits.length > 1 && first.score >= second.score * BEST_ANSWER_MARGIN;
  const rest = hasBestAnswer ? hits.slice(1) : hits;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Text tone="secondary" role="status">
          {hits.length === 1 ? t("help.resultsOne", { query }) : t("help.results", { count: hits.length, query })}
        </Text>
        {corrections.length > 0 && <Text size="xs" tone="muted">{t("help.showingFor", { query: corrected })}</Text>}
      </div>
      {hasBestAnswer && (
        <section aria-label={t("help.bestAnswer")} className="space-y-3">
          <SectionHeader title={t("help.bestAnswer")} />
          <ListItemGroup>
            <ResultRow hit={first} index={index} onOpen={open} highlighted />
          </ListItemGroup>
        </section>
      )}
      <section aria-label={hasBestAnswer ? t("help.moreResults") : t("help.searchTitle")} className="space-y-3">
        {hasBestAnswer && <SectionHeader title={t("help.moreResults")} />}
        <ListItemGroup>
          {rest.map((hit) => (
            <ResultRow key={hit.id} hit={hit} index={index} onOpen={open} />
          ))}
        </ListItemGroup>
      </section>
    </div>
  );
}

/** Resultados de `/ayuda/buscar?q=…`, con el buscador arriba para afinar. */
export function HelpSearchPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const index = useHelpIndex();
  const docs = useHelpSearchDocs(query.length > 0);

  return (
    <HelpPage>
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("help.title"), onClick: () => navigate(helpPath()) }, t("help.searchTitle")]} />
      </ShellHeaderSlot>
      <div className="space-y-4">
        <Heading level={1}>{t("help.searchTitle")}</Heading>
        <HelpSearchBox key={query} initialQuery={query} autoFocus={!query} className="max-w-narrow" />
      </div>
      {query && (
        <QueryBoundary query={index}>
          {(loadedIndex) => <QueryBoundary query={docs}>{(loadedDocs) => <Results index={loadedIndex} docs={loadedDocs} query={query} />}</QueryBoundary>}
        </QueryBoundary>
      )}
    </HelpPage>
  );
}
