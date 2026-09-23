import { Card } from "@/components/ui/card";
import { LanguageSelector, useLocale, useLocalizer } from "@/i18n";
import { DocSection, PageIntro } from "../components/PageIntro";
import { CodeBlock } from "../components/CodeBlock";

const COPY = {
  eyebrow: { es: "Fundamentos", en: "Foundations" },
  title: { es: "Idioma", en: "Language" },
  intro: {
    es: "Un solo interruptor para toda la interfaz. El sistema trae sus propias cadenas traducidas y expone el idioma activo para que la aplicación traduzca las suyas con la misma palanca.",
    en: "One switch for the whole interface. The system ships its own strings translated and exposes the active locale so the application translates its own with the same lever.",
  },
  layersTitle: { es: "Dos capas, a propósito", en: "Two layers, on purpose" },
  layersDescription: {
    es: "Confundirlas es el error que deja una aplicación a medio traducir. El sistema no traduce tu contenido; te presta el idioma.",
    en: "Confusing them is the mistake that leaves an application half translated. The system does not translate your content; it lends you the locale.",
  },
  systemTitle: { es: "1. Las cadenas del sistema", en: "1. The system's strings" },
  systemBody: {
    es: "Las que traen los componentes de fábrica: «Cancelar», la paginación, los date pickers, el marco. Viven en src/i18n/messages, no necesitan ninguna librería externa y ya vienen en español e inglés.",
    en: "The ones components ship with: “Cancel”, pagination, date pickers, the shell. They live in src/i18n/messages, need no external library and already come in Spanish and English.",
  },
  appTitle: { es: "2. El contenido de tu aplicación", en: "2. Your application's content" },
  appBody: {
    es: "Tus pantallas, tus datos, tus textos. Eso lo traduces tú con la herramienta que prefieras (react-i18next, FormatJS…). Del sistema tomas useLocale() para compartir el idioma activo, y así hay un interruptor y no dos.",
    en: "Your screens, your data, your copy. You translate that with whatever tool you prefer (react-i18next, FormatJS…). From the system you take useLocale() so the active locale is shared, and there is one switch instead of two.",
  },
  tryTitle: { es: "Pruébalo", en: "Try it" },
  tryDescription: {
    es: "El mismo selector que ya está en la cabecera. Cambia el idioma y mira la navegación, las migas y los componentes de esta doc.",
    en: "The same selector that already sits in the header. Switch the locale and watch this doc's navigation, breadcrumbs and components.",
  },
  activeLabel: { es: "Idioma activo", en: "Active locale" },
  usageTitle: { es: "Cómo se usa", en: "How to use it" },
  usageDescription: {
    es: "Un proveedor arriba del árbol y un hook donde haga falta, igual que el tema.",
    en: "A provider at the top of the tree and a hook wherever you need it, just like the theme.",
  },
  formatsTitle: { es: "Números y fechas no se traducen: se formatean", en: "Numbers and dates aren't translated: they're formatted" },
  formatsDescription: {
    es: "`Intl` ya viene en el navegador y sabe de cada idioma más que cualquier diccionario. El sistema solo le pasa el idioma activo.",
    en: "`Intl` already ships in the browser and knows more about each locale than any dictionary could. The system just hands it the active locale.",
  },
  missingTitle: { es: "Qué pasa si falta una traducción", en: "What happens when a translation is missing" },
  missingDescription: {
    es: "Nunca se ve la clave cruda ni un hueco: el idioma pedido cae al inglés y el inglés al español, que es la lengua fuente. Por eso se puede abrir un idioma nuevo con veinte cadenas y crecer desde ahí.",
    en: "You never see a raw key or a gap: the requested locale falls back to English, and English to Spanish, the source language. That is why a new locale can open with twenty strings and grow from there.",
  },
};

const PROVIDER_CODE = `import { LocaleProvider } from "@/i18n";

<LocaleProvider>
  <ThemeProvider>{children}</ThemeProvider>
</LocaleProvider>`;

const HOOK_CODE = `import { useT, useLocale } from "@/i18n";

const t = useT();
<Button>{t("common.cancel")}</Button>
<p>{t("table.selected", { count: 3 })}</p>   // "3 seleccionados"

// El idioma activo, para tu propia librería de traducciones
const { locale, formatNumber, formatDate } = useLocale();`;

const LOCALIZED_CODE = `import type { Localized } from "@/i18n";

// Un texto largo que vive junto a lo que describe acepta las dos formas:
description: "La acción del sistema."                       // solo español
description: { es: "La acción del sistema.", en: "The system's action." }

// Y se resuelve con el idioma activo:
const tr = useLocalizer();
<p>{tr(entry.description)}</p>`;

/**
 * El fundamento de idioma. Cuenta la decisión de fondo —qué traduce el
 * sistema y qué traduce cada aplicación— antes que la API, porque es lo que
 * decide si una plataforma acaba traducida a medias o entera.
 */
export function LanguagePage() {
  const tr = useLocalizer();
  const { current, locales, formatNumber, formatDate } = useLocale();
  const sample = new Date(2026, 8, 22);

  return (
    <div className="cascade-enter space-y-section">
      <PageIntro eyebrow={tr(COPY.eyebrow)} title={tr(COPY.title)} description={tr(COPY.intro)} />

      <DocSection id="capas" title={tr(COPY.layersTitle)} description={tr(COPY.layersDescription)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2 p-card">
            <h3 className="text-sm font-semibold text-text-primary">{tr(COPY.systemTitle)}</h3>
            <p className="text-[13px] leading-relaxed text-text-secondary">{tr(COPY.systemBody)}</p>
          </Card>
          <Card className="space-y-2 p-card">
            <h3 className="text-sm font-semibold text-text-primary">{tr(COPY.appTitle)}</h3>
            <p className="text-[13px] leading-relaxed text-text-secondary">{tr(COPY.appBody)}</p>
          </Card>
        </div>
      </DocSection>

      <DocSection id="probar" title={tr(COPY.tryTitle)} description={tr(COPY.tryDescription)}>
        <Card className="flex flex-wrap items-center justify-between gap-4 p-card">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {tr(COPY.activeLabel)}
            </p>
            <p className="mt-1 text-lg font-semibold text-text-primary">
              {current.nativeName} <span className="text-text-muted">· {current.intl}</span>
            </p>
            <p className="mt-1 text-[12px] text-text-secondary">
              {locales.map((locale) => locale.nativeName).join(" · ")}
            </p>
          </div>
          <LanguageSelector />
        </Card>
      </DocSection>

      <DocSection id="uso" title={tr(COPY.usageTitle)} description={tr(COPY.usageDescription)}>
        <div className="space-y-4">
          <CodeBlock code={PROVIDER_CODE} />
          <CodeBlock code={HOOK_CODE} />
        </div>
      </DocSection>

      <DocSection id="formatos" title={tr(COPY.formatsTitle)} description={tr(COPY.formatsDescription)}>
        <Card className="grid gap-4 p-card sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">formatNumber</p>
            <p className="mt-1 font-mono text-lg tabular-nums text-text-primary">{formatNumber(1284.5)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">formatDate</p>
            <p className="mt-1 font-mono text-lg text-text-primary">
              {formatDate(sample, { dateStyle: "long" })}
            </p>
          </div>
        </Card>
      </DocSection>

      <DocSection id="faltantes" title={tr(COPY.missingTitle)} description={tr(COPY.missingDescription)}>
        <CodeBlock code={LOCALIZED_CODE} />
      </DocSection>
    </div>
  );
}
