import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DOC_GROUPS, entriesByGroup, findEntry } from "../registry";
import { GROUP_ICONS } from "../docsNavigation";
import { routeToHash } from "../router";
import { FOUNDATION_PAGES } from "../foundationPages";
import { GUIDE_SECTIONS, guidesBySection } from "../guidePages";
import { useLocalizer, useT } from "@/i18n";
import { HomeHero } from "./HomeHero";
import { SHOWCASE_COMPONENT_IDS, SHOWCASE_FOUNDATION_IDS, SHOWCASE_GROUP_DESCRIPTION, SHOWCASE_GROUP_LABEL, useShowcaseMode } from "../showcase";

/**
 * El encabezado de cada tramo de la portada: rótulo en versalitas, título y
 * una línea que se come el resto del ancho. La línea es lo que da ritmo
 * editorial a una página que, sin ella, sería una pila de rejillas iguales.
 */
function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</span>
        <span className="h-px flex-1 bg-border/60" aria-hidden />
      </div>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary">{title}</h2>
      {description && <p className="max-w-2xl text-[13.5px] leading-relaxed text-text-secondary">{description}</p>}
    </header>
  );
}

/**
 * La tarjeta-enlace de la portada. Todas las rejillas de abajo son la misma
 * pieza con distinto contenido: icono en una pastilla teñida, título, una
 * línea de qué hay dentro y la flecha que se desplaza al pasar por encima.
 */
function LinkCard({
  href,
  icon: Icon,
  title,
  description,
  meta,
  className,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  /** Solo para el sitio que ocupa en la rejilla, nunca para repintar la tarjeta. */
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "magic-card-sweep magic-card-lift group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-surface p-4 shadow-card transition-colors hover:border-primary/40",
        className
      )}
    >
      <div className="relative z-10 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-text-primary group-hover:text-primary">
          {title}
        </span>
        {meta}
        <ArrowRight className="size-4 shrink-0 text-text-muted transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      {description && (
        <p className="relative z-10 text-[12.5px] leading-relaxed text-text-secondary">{description}</p>
      )}
    </a>
  );
}

/**
 * La rejilla de la vitrina (ver `showcase.ts`): en lugar de las familias, los
 * componentes de la selección, cada uno hacia su propia página.
 */
function ShowcaseComponents() {
  const tr = useLocalizer();
  const t = useT();
  const entries = SHOWCASE_COMPONENT_IDS.map(findEntry).filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);
  return (
    <section className="space-y-5">
      <SectionHeader eyebrow={t("docs.components")} title={tr(SHOWCASE_GROUP_LABEL)} description={tr(SHOWCASE_GROUP_DESCRIPTION)} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <LinkCard
            key={entry.id}
            href={routeToHash({ kind: "component", id: entry.id })}
            icon={GROUP_ICONS[entry.group]}
            title={entry.name}
            description={tr(entry.description)}
          />
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const groupsWithEntries = DOC_GROUPS.filter((group) => entriesByGroup(group.id).length > 0);
  const tr = useLocalizer();
  const t = useT();
  // En la vitrina la portada no enlaza a nada escondido: sin guías, solo la
  // marca entre los fundamentos y la selección en vez de las familias.
  const showcase = useShowcaseMode();
  const guideSections = showcase ? [] : GUIDE_SECTIONS;
  const foundationPages = showcase ? FOUNDATION_PAGES.filter((page) => SHOWCASE_FOUNDATION_IDS.includes(page.id)) : FOUNDATION_PAGES;

  return (
    <div className="cascade-enter space-y-section">
      <HomeHero />

      {guideSections.map((section) => (
        <section key={section.id} className="space-y-5">
          <SectionHeader
            eyebrow={t("docs.guides")}
            title={tr(section.label)}
            description={tr(section.description)}
          />
          {/* `auto-fit` en vez de un número fijo de columnas: una sección con
              tres guías y otra con cuatro llenan su fila igual, sin el hueco
              que deja una rejilla de cuatro cuando solo hay tres tarjetas. */}
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
            {guidesBySection(section.id).map((page) => (
              <LinkCard
                key={page.id}
                href={routeToHash({ kind: "guide", id: page.id })}
                icon={page.icon}
                title={tr(page.label)}
                description={tr(page.description)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-5">
        <SectionHeader
          eyebrow={t("docs.foundations")}
          title={tr({ es: "De qué está hecho", en: "What it's made of" })}
          description={tr({
            es: "Los tokens que comparten todas las piezas: si algo se decide aquí, ningún componente vuelve a decidirlo por su cuenta.",
            en: "The tokens every piece shares: once something is decided here, no component decides it again on its own.",
          })}
        />
        {/* Siete fundamentos en una rejilla de cuatro: el primero —Temas, que es
            de lo que va este sistema— ocupa dos y la última fila queda llena. */}
        <div className={cn("grid gap-3 sm:grid-cols-2", showcase ? "lg:grid-cols-2" : "lg:grid-cols-4")}>
          {foundationPages.map((page, index) => (
            <LinkCard
              key={page.id}
              href={routeToHash({ kind: "foundation", id: page.id })}
              icon={page.icon}
              title={tr(page.label)}
              description={tr(page.description)}
              className={index === 0 ? "lg:col-span-2" : undefined}
            />
          ))}
        </div>
      </section>

      {showcase ? (
        <ShowcaseComponents />
      ) : (
        <section className="space-y-5">
          <SectionHeader
            eyebrow={t("docs.components")}
            title={tr({ es: "Familias", en: "Families" })}
            description={tr({
              es: "Cada familia trae sus piezas documentadas, con playground, props y guías de uso.",
              en: "Each family brings its pieces documented, with a playground, props and usage guidance.",
            })}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupsWithEntries.map((group) => (
              <LinkCard
                key={group.id}
                href={routeToHash({ kind: "group", id: group.id })}
                icon={GROUP_ICONS[group.id]}
                title={tr(group.label)}
                description={tr(group.description)}
                meta={<Badge variant="neutral">{entriesByGroup(group.id).length}</Badge>}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
