import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { Clock, ThumbsDown, ThumbsUp } from "lucide-react";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs, Scrollspy } from "@/components/navigation";
import { HelpPage } from "../HelpPage";
import { Heading, Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/utility";
import { ListItemGroup } from "@/components/data-display/ListItem";
import { QueryBoundary } from "@/lib/query";
import { useAppT } from "@/app/i18n";
import type { HelpArticleMeta, HelpIndex } from "@/lib/help";
import { helpPath, useHelpArticle, useHelpIndex } from "../content";
import { HelpMarkdown } from "../markdown/HelpMarkdown";
import { prepareBody } from "../markdown/prepareBody";
import { ArticleRow, RoleTags, StatusTag } from "../HelpBits";
import { useFormatUpdated } from "../useFormatUpdated";
import { HelpNotFoundPage } from "./HelpNotFoundPage";

const FEEDBACK_KEY = (id: string) => `help.feedback.${id}`;

/**
 * «¿Te sirvió?» se recuerda en el navegador para no volver a preguntar. No
 * hay endpoint todavía: cuando exista, aquí se envía además de guardarse.
 */
function Feedback({ articleId }: { articleId: string }) {
  const t = useAppT();
  const [answer, setAnswer] = React.useState<"yes" | "no" | null>(() => {
    try {
      const stored = window.localStorage.getItem(FEEDBACK_KEY(articleId));
      return stored === "yes" || stored === "no" ? stored : null;
    } catch {
      return null;
    }
  });
  const vote = (value: "yes" | "no") => {
    setAnswer(value);
    try {
      window.localStorage.setItem(FEEDBACK_KEY(articleId), value);
    } catch {
      /* sin almacenamiento, sin memoria: se pregunta la próxima vez */
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-3" data-testid="help-feedback">
      <Text size="sm" weight="medium" tone="primary">
        {t("help.wasHelpful")}
      </Text>
      {answer ? (
        <Text size="sm" tone="secondary" role="status">
          {t("help.thanks")}
        </Text>
      ) : (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => vote("yes")}>
            <ThumbsUp className="size-3.5" />
            {t("help.yes")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => vote("no")}>
            <ThumbsDown className="size-3.5" />
            {t("help.no")}
          </Button>
        </div>
      )}
    </div>
  );
}

function BodySkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function ArticleView({ index, article }: { index: HelpIndex; article: HelpArticleMeta }) {
  const t = useAppT();
  const navigate = useNavigate();
  const formatUpdated = useFormatUpdated();
  const body = useHelpArticle(article.id);
  const section = index.sections.find((item) => item.id === article.section);
  const related = article.related.map((id) => index.articles[id]).filter(Boolean);
  const toc = article.headings.filter((heading) => heading.level === 2).map((heading) => ({ id: heading.id, label: heading.text }));

  // El índice lateral sigue el scroll del contenedor del shell, no de la
  // ventana. Se localiza una vez montado y se le pasa como ref.
  const marker = React.useRef<HTMLDivElement>(null);
  const [scroller, setScroller] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setScroller(marker.current?.closest<HTMLElement>(".overflow-y-auto") ?? null);
  }, []);
  const scrollerRef = React.useMemo(() => ({ current: scroller }), [scroller]);

  return (
    <HelpPage>
      <ShellHeaderSlot>
        <Breadcrumbs
          items={[
            { label: t("help.title"), onClick: () => navigate(helpPath()) },
            { label: section?.title ?? article.section, onClick: () => navigate(helpPath(article.section)) },
            article.title,
          ]}
          className="min-w-0 max-w-[45vw] overflow-hidden whitespace-nowrap sm:max-w-none"
        />
      </ShellHeaderSlot>
      <div ref={marker} aria-hidden className="sr-only" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <article className="min-w-0">
          <header className="space-y-3 border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Text variant="caption">{section?.title}</Text>
              <StatusTag status={article.status} />
            </div>
            <Heading level={1}>{article.title}</Heading>
            <Text variant="lead" tone="secondary">
              {article.description}
            </Text>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                {t("help.forRoles")} <RoleTags roles={article.roles} />
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {t("help.readingMinutes", { count: article.readingMinutes })}
              </span>
              <span>{t("help.updated", { date: formatUpdated(article.updated) })}</span>
            </div>
          </header>

          {article.status === "draft" && (
            <Alert variant="warning" className="mt-6">
              <AlertDescription>{t("help.draftNotice")}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <QueryBoundary query={body} loading={<BodySkeleton />}>
              {(markdown) => <HelpMarkdown body={prepareBody(markdown, index)} headings={article.headings} />}
            </QueryBoundary>
          </div>

          <div className="mt-10 space-y-8">
            <Feedback articleId={article.id} />
            {related.length > 0 && (
              <section aria-label={t("help.related")} className="space-y-4">
                <SectionHeader title={t("help.related")} />
                <ListItemGroup>
                  {related.map((item) => (
                    <ArticleRow key={item.id} article={item} onOpen={(id) => navigate(helpPath(id))} />
                  ))}
                </ListItemGroup>
              </section>
            )}
          </div>
        </article>

        {toc.length > 1 && (
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <Scrollspy sections={toc} scrollContainer={scrollerRef} offset={24} title={t("help.onThisPage")} />
            </div>
          </aside>
        )}
      </div>
    </HelpPage>
  );
}

/** Un artículo: cabecera con metadatos, cuerpo en Markdown, índice lateral, relacionados y «¿te sirvió?». */
export function HelpArticlePage() {
  const { section = "", article: articleSlug = "" } = useParams();
  const id = `${section}/${articleSlug}`;
  const query = useHelpIndex();
  return (
    <QueryBoundary query={query}>
      {(index) => {
        const article = index.articles[id];
        return article ? <ArticleView key={id} index={index} article={article} /> : <HelpNotFoundPage />;
      }}
    </QueryBoundary>
  );
}
