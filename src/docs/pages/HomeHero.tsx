import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Localized } from "@/i18n";
import {
  THEME_PRESETS,
  ThemeSwatch,
  resolveHeadingFont,
  useTheme,
  type DensityScale,
  type RadiusScale,
} from "@/themes";
import { useLocalizer } from "@/i18n";
import { ALL_ENTRIES, DOC_GROUPS, entriesByGroup } from "../registry";
import { routeToHash } from "../router";

/**
 * Atmósfera del hero, en tres capas que se suman sobre la superficie:
 * la malla de IA que ya usa el producto, un halo del primario en la esquina
 * opuesta —así el hero cambia de color con el tema, no solo los botones— y
 * una retícula fina que se desvanece hacia el centro. Todas son referencias a
 * tokens (`hsl(var(--…))`), nunca colores escritos a mano: al cambiar de tema
 * la portada se repinta sola.
 */
const GLOW_LAYER: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(58% 70% at 82% 6%, hsl(var(--primary) / 0.22), transparent 66%), radial-gradient(42% 60% at 4% 92%, hsl(var(--primary) / 0.12), transparent 70%)",
};

const GRID_LAYER: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, hsl(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.55) 1px, transparent 1px)",
  backgroundSize: "58px 58px",
  maskImage: "radial-gradient(115% 85% at 4% 0%, black 4%, transparent 62%)",
  WebkitMaskImage: "radial-gradient(115% 85% at 4% 0%, black 4%, transparent 62%)",
};

const RADIUS_LABELS: Readonly<Record<RadiusScale, Localized>> = {
  none: { es: "Recto", en: "Square" },
  sm: { es: "Suave", en: "Soft" },
  md: { es: "Medio", en: "Medium" },
  lg: { es: "Redondo", en: "Round" },
};

const DENSITY_LABELS: Readonly<Record<DensityScale, Localized>> = {
  compact: { es: "Compacta", en: "Compact" },
  normal: { es: "Normal", en: "Normal" },
  comfortable: { es: "Amplia", en: "Comfortable" },
};

/** Los textos del hero: es la portada, así que va traducida de verdad. */
const HERO_COPY = {
  eyebrow: { es: "Sistema de diseño Thema · v0.1", en: "Thema design system · v0.1" },
  titleTop: { es: "Un solo sistema.", en: "One system." },
  titleAccent: { es: "Los temas que necesites.", en: "Every theme you need." },
  lead: {
    es: "Cada componente del producto con su código, sus props y sus estados, sobre tokens de color, tipografía, radio, espaciado y motion. Cambia el tema y todo lo sigue: como en shadcn, pero con la identidad Thema.",
    en: "Every product component with its code, its props and its states, on top of color, type, radius, spacing and motion tokens. Change the theme and everything follows: like shadcn, but with Thema's identity.",
  },
  explore: { es: "Explorar componentes", en: "Explore components" },
  howTo: { es: "Cómo usar el sistema", en: "How to use the system" },
  activeTheme: { es: "Tema activo", en: "Active theme" },
  radius: { es: "Radio", en: "Radius" },
  density: { es: "Densidad", en: "Density" },
  headings: { es: "Títulos", en: "Headings" },
  components: { es: "Componentes", en: "Components" },
  families: { es: "Familias", en: "Families" },
  themes: { es: "Temas", en: "Themes" },
  tokens: { es: "Tokens por tema", en: "Tokens per theme" },
  applyTheme: { es: "Aplicar tema", en: "Apply theme" },
  colorTheme: { es: "Tema de color", en: "Color theme" },
} as const;

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[12px] text-text-muted">{label}</dt>
      <dd className="truncate text-[12.5px] font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

/**
 * La ficha del tema activo: su nombre, su descripción, los doce presets y
 * los tres ajustes que no son color (radio, densidad y letra de títulos).
 * Es la prueba del mensaje del hero —un sistema, muchos temas— sin fingir una
 * pantalla de producto: lo que se ve aquí son los tokens, que es de lo que va
 * la portada.
 */
function ActiveThemeCard() {
  const { preset, setPreset, radius, density, font, headingFont } = useTheme();
  const heading = resolveHeadingFont(headingFont, font);
  const tr = useLocalizer();

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/80 p-5 shadow-card backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{tr(HERO_COPY.activeTheme)}</p>
          <p className="mt-1 truncate font-heading text-xl font-bold tracking-tight text-text-primary">{preset.name}</p>
        </div>
        {preset.tier === "premium" && <Badge variant="neutral">Premium</Badge>}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">{preset.description}</p>

      <div role="radiogroup" aria-label={tr(HERO_COPY.colorTheme)} className="mt-4 grid grid-cols-7 gap-1.5">
        {THEME_PRESETS.map((item) => {
          const isActive = item.id === preset.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${tr(HERO_COPY.applyTheme)} ${item.name}`}
              title={item.name}
              onClick={() => setPreset(item.id)}
              className="flex items-center justify-center rounded-full p-0.5 ring-2 ring-transparent transition-transform duration-fast hover:scale-110 focus-visible:outline-none focus-visible:ring-primary/60 aria-checked:ring-primary"
            >
              <ThemeSwatch preset={item} className="size-6" />
            </button>
          );
        })}
      </div>

      <dl className="mt-4 space-y-2 border-t border-border/60 pt-3.5">
        <SpecRow label={tr(HERO_COPY.radius)} value={tr(RADIUS_LABELS[radius])} />
        <SpecRow label={tr(HERO_COPY.density)} value={tr(DENSITY_LABELS[density])} />
        <SpecRow label={tr(HERO_COPY.headings)} value={heading.name} />
      </dl>
    </div>
  );
}

function HeroStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="bg-surface/80 px-5 py-4 backdrop-blur-sm sm:px-7 sm:py-5">
      <dd className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{value}</dd>
      <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</dt>
    </div>
  );
}

/**
 * La portada del sistema. Es la primera pantalla que ve alguien que llega al
 * DSM, así que dice tres cosas de un vistazo: qué es esto (el título), de qué
 * tamaño es (la banda de cifras) y qué se puede tocar (la ficha del tema).
 */
export function HomeHero() {
  const { tokens } = useTheme();
  const tr = useLocalizer();
  const familyCount = DOC_GROUPS.filter((group) => entriesByGroup(group.id).length > 0).length;

  return (
    <section
      aria-labelledby="dsm-hero-title"
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-premium"
    >
      <div aria-hidden className="ai-mesh-agent pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={GLOW_LAYER} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={GRID_LAYER} />

      <div className="relative grid gap-9 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:p-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/70 py-1 pl-2 pr-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary backdrop-blur-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {tr(HERO_COPY.eyebrow)}
          </span>

          <h1
            id="dsm-hero-title"
            className="mt-5 text-balance font-heading text-[clamp(2.35rem,1.1rem+4.1vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.03em] text-text-primary"
          >
            {tr(HERO_COPY.titleTop)}
            {/* `leading` propio: la base de la hoja da a todo `span` un interlineado
                de cuerpo (1.625) que, dentro de un titular de 68px, abría un
                hueco de casi dos líneas entre la primera y la segunda. */}
            <span className="mt-1 block leading-[0.98] text-ai-gradient">{tr(HERO_COPY.titleAccent)}</span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-text-secondary sm:text-base">
            {tr(HERO_COPY.lead)}
          </p>

          <div className="mt-7 flex flex-wrap gap-inline">
            <Button asChild size="lg">
              <a href={routeToHash({ kind: "group", id: "ui" })}>
                {tr(HERO_COPY.explore)} <ArrowRight />
              </a>
            </Button>
            {/* `link` y no `outline`: sobre la superficie teñida del hero el filo
                del outline cae casi en el color del fondo y el botón desaparecía.
                Como enlace se lee de lejos y no compite con el primario. */}
            <Button asChild variant="link" size="lg">
              <a href={routeToHash({ kind: "guide", id: "como-usar" })}>{tr(HERO_COPY.howTo)}</a>
            </Button>
          </div>
        </div>

        <ActiveThemeCard />
      </div>

      {/* La banda de cifras cierra el hero: dice el tamaño del sistema sin
          robarle la línea al titular, y de paso separa la portada de lo que
          viene debajo. */}
      <dl className="relative grid grid-cols-2 gap-px border-t border-border/60 bg-border/70 sm:grid-cols-4">
        <HeroStat value={ALL_ENTRIES.length} label={tr(HERO_COPY.components)} />
        <HeroStat value={familyCount} label={tr(HERO_COPY.families)} />
        <HeroStat value={THEME_PRESETS.length} label={tr(HERO_COPY.themes)} />
        <HeroStat value={Object.keys(tokens).length} label={tr(HERO_COPY.tokens)} />
      </dl>
    </section>
  );
}