import * as React from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Clock, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { HelpPage } from "../HelpPage";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/typography";
import { IconTile } from "@/components/utility";
import { QueryBoundary } from "@/lib/query";
import { useAppT } from "@/app/i18n";
import type { HelpArticleMeta, HelpIndex, HelpSection } from "@/lib/help";
import { helpPath, useHelpIndex } from "../content";
import { SectionIcon } from "../SectionIcon";
import { HelpSearchBox } from "../HelpSearchBox";
import { useFormatUpdated } from "../useFormatUpdated";

const CARD_PREVIEW = 3;
const START_LIMIT = 4;
const RECENT_LIMIT = 5;

/** El encabezado de cada tramo: rótulo en versalitas, título y la línea que da ritmo. */
function Eyebrow({ label, title, action }: { label: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="space-y-1.5">
      <div className="flex items-center gap-4">
        <Text as="span" size="xs" weight="bold" tone="primary" className="uppercase tracking-[0.16em]">{label}</Text>
        <span className="h-px flex-1 bg-border/60" aria-hidden />
        {action}
      </div>
      <Heading level={3}>{title}</Heading>
    </header>
  );
}

/** La tarjeta de un tema: icono, qué hay dentro y los primeros artículos como enlaces. */
function TopicCard({ section, articles }: { section: HelpSection; articles: readonly HelpArticleMeta[] }) {
  const t = useAppT();
  const count = section.articles.length;
  return (
    <article
      className="magic-card-sweep magic-card-lift group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-card transition-colors hover:border-primary/40"
      data-testid={`help-section-${section.id}`}
    >
      <div className="relative z-10 flex items-start gap-3">
        <IconTile icon={<SectionIcon name={section.icon} />} size="md" />
        <div className="min-w-0 flex-1">
          <Link to={helpPath(section.id)} className="text-base font-semibold text-text-primary after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:outline-none">
            {section.title}
          </Link>
          <Text size="sm" tone="secondary" className="mt-0.5">
            {section.description}
          </Text>
        </div>
      </div>
      <ul className="relative z-10 space-y-1.5 border-t border-border/60 pt-3">
        {articles.slice(0, CARD_PREVIEW).map((article) => (
          <li key={article.id}>
            <Link
              to={helpPath(article.id)}
              className="relative z-20 flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
            >
              <span className="size-1 shrink-0 rounded-full bg-primary/50" aria-hidden />
              <span className="truncate">{article.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <span className="relative z-10 mt-auto flex items-center justify-between text-xs font-medium text-text-muted">
        {count === 1 ? t("help.articlesOne") : t("help.articlesCount", { count })}
        <ArrowRight className="size-4 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-primary" />
      </span>
    </article>
  );
}

/** Un paso del arranque: número grande, título y descripción, todo enlace. */
function StepRow({ position, article }: { position: number; article: HelpArticleMeta }) {
  const t = useAppT();
  return (
    <li>
      <Link
        to={helpPath(article.id)}
        className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{position}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-text-primary group-hover:text-primary">{article.title}</span>
          <span className="line-clamp-2 text-xs leading-relaxed text-text-secondary">{article.description}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-text-muted">
          <Clock className="size-3.5" />
          {t("help.readingMinutes", { count: article.readingMinutes })}
        </span>
      </Link>
    </li>
  );
}

function RecentRow({ article }: { article: HelpArticleMeta }) {
  const formatUpdated = useFormatUpdated();
  return (
    <li>
      <Link
        to={helpPath(article.id)}
        className="group flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-text-primary group-hover:text-primary">{article.title}</span>
          <span className="text-xs text-text-muted">{formatUpdated(article.updated)}</span>
        </span>
        <ArrowRight className="mt-1 size-4 shrink-0 text-text-muted transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </li>
  );
}

function HomeContent({ index }: { index: HelpIndex }) {
  const t = useAppT();
  const navigate = useNavigate();
  const sections = index.sections.filter((section) => section.articles.length > 0);
  const articlesOf = (section: HelpSection) => section.articles.map((id) => index.articles[id]).filter(Boolean);
  // «Empieza por aquí» es la sección de arranque si ya tiene artículos; si
  // no, la primera que los tenga, para que la portada nunca quede vacía.
  const startSection = sections.find((section) => section.id === "empezar") ?? sections[0];
  const startArticles = startSection ? articlesOf(startSection).slice(0, START_LIMIT) : [];
  const recent = Object.values(index.articles)
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title, "es"))
    .slice(0, RECENT_LIMIT);
  const popular = t("help.popularList")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <>
      <section
        aria-labelledby="help-home-heading"
        className="relative isolate z-20 px-2 pb-6 pt-10 sm:pt-14"
      >
        {/* Sin contenedor ni luz propia: el hero es el título y el buscador
            sobre la atmósfera de la plataforma, que ya pinta el shell. Una
            segunda gradación aquí se sumaba a esa y se leía doble. */}
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary backdrop-blur">
            {t("help.eyebrow")}
          </span>
          <div className="space-y-3">
            <Heading level={1} id="help-home-heading" weight="bold">
              {t("help.homeTitle")}
            </Heading>
            <Text variant="lead" tone="secondary">
              {t("help.homeLead")}
            </Text>
          </div>
          <HelpSearchBox size="hero" suggestions={popular} className="w-full text-left" />
        </div>
      </section>

      <section aria-label={t("help.topics")} className="space-y-5">
        <Eyebrow label={t("help.topicsEyebrow")} title={t("help.topics")} />
        <div className={cn("grid gap-4", sections.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2")}>
          {sections.map((section) => (
            <TopicCard key={section.id} section={section} articles={articlesOf(section)} />
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {startArticles.length > 0 && startSection && (
          <section aria-label={t("help.startHere")} className="space-y-5">
            <Eyebrow
              label={t("help.startEyebrow")}
              title={t("help.startHere")}
              action={
                <Link to={helpPath(startSection.id)} className="text-xs font-medium text-primary hover:underline">
                  {t("help.viewAll", { count: startSection.articles.length })}
                </Link>
              }
            />
            <ol className="space-y-3">
              {startArticles.map((article, position) => (
                <StepRow key={article.id} position={position + 1} article={article} />
              ))}
            </ol>
          </section>
        )}
        {recent.length > 0 && (
          <section aria-label={t("help.recentlyUpdated")} className="space-y-5">
            <Eyebrow label={t("help.recentEyebrow")} title={t("help.recentlyUpdated")} />
            <ul className="rounded-2xl border border-border/60 bg-surface p-2 shadow-card">
              {recent.map((article) => (
                <RecentRow key={article.id} article={article} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <section
        aria-label={t("help.ctaTitle")}
        className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-3xl border border-border/60 bg-surface-nav px-6 py-8 text-nav-foreground shadow-card sm:px-10 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-start gap-4">
          <IconTile icon={<MessageCircleQuestion />} tone="ai" size="lg" />
          <div className="space-y-1">
            <Text as="h2" size="lg" weight="semibold" tone="inverse">
              {t("help.ctaTitle")}
            </Text>
            <Text size="sm" tone="inverse" className="opacity-75">
              {t("help.ctaLead")}
            </Text>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" className="border-nav-foreground/30 bg-transparent text-nav-foreground hover:bg-nav-foreground/10 hover:text-nav-foreground" onClick={() => navigate(`${helpPath()}/buscar`)}>
            {t("help.ctaSearch")}
          </Button>
          <Button asChild>
            <Link to="/metricas">
              {t("help.ctaOpenApp")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

export function HelpHomePage() {
  const t = useAppT();
  const query = useHelpIndex();
  return (
    <HelpPage>
      <ShellHeaderSlot>
        <Breadcrumbs items={[t("help.title")]} />
      </ShellHeaderSlot>
      <QueryBoundary query={query}>{(index) => <HomeContent index={index} />}</QueryBoundary>
    </HelpPage>
  );
}
