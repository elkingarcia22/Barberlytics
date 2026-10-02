import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { HelpPage } from "../HelpPage";
import { Heading, Text } from "@/components/typography";
import { IconTile, SectionHeader } from "@/components/utility";
import { ListItemGroup } from "@/components/data-display/ListItem";
import { QueryBoundary } from "@/lib/query";
import { useAppT } from "@/app/i18n";
import { groupSectionArticles } from "@/lib/help";
import { helpPath, useHelpIndex } from "../content";
import { SectionIcon } from "../SectionIcon";
import { ArticleRow } from "../HelpBits";
import { HelpNotFoundPage } from "./HelpNotFoundPage";

/** Un tema con sus artículos en el orden del contenido; las secciones grandes, repartidos en subgrupos. */
export function HelpSectionPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { section: sectionId = "" } = useParams();
  const query = useHelpIndex();
  const { hash } = useLocation();

  // El menú enlaza cada subgrupo como `/ayuda/<sección>#<subgrupo>`: al llegar, se baja hasta él.
  React.useEffect(() => {
    if (!hash || !query.data) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [hash, query.data]);

  return (
    <QueryBoundary query={query}>
      {(index) => {
        const section = index.sections.find((item) => item.id === sectionId);
        if (!section) return <HelpNotFoundPage />;
        const groups = groupSectionArticles(section, index);
        const count = groups.reduce((total, group) => total + group.articles.length, 0);
        return (
          <HelpPage>
            <ShellHeaderSlot>
              <Breadcrumbs items={[{ label: t("help.title"), onClick: () => navigate(helpPath()) }, section.title]} />
            </ShellHeaderSlot>
            <header className="flex items-start gap-4">
              <IconTile icon={<SectionIcon name={section.icon} />} size="lg" />
              <div className="space-y-1">
                <Heading level={1}>{section.title}</Heading>
                <Text tone="secondary">{section.description}</Text>
                <Text variant="caption">
                  {count === 1 ? t("help.articlesOne") : t("help.articlesCount", { count })}
                </Text>
              </div>
            </header>
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.id || "todos"} id={group.id || undefined} aria-label={group.title || section.title} className="scroll-mt-24 space-y-3">
                  {group.title && <SectionHeader title={group.title} />}
                  <ListItemGroup>
                    {group.articles.map((article) => (
                      <ArticleRow key={article.id} article={article} onOpen={(id) => navigate(helpPath(id))} />
                    ))}
                  </ListItemGroup>
                </section>
              ))}
            </div>
          </HelpPage>
        );
      }}
    </QueryBoundary>
  );
}
