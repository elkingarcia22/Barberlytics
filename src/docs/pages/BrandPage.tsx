import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { BarberlyticsLogo, type BarberlyticsLogoGradient } from "@/components/ui/BarberlyticsLogo";
import { ARROW_PATH, BARBER_PATH, LOGO_METRICS, LOGO_X, LYTICS_PATH, WORDMARK_BOX } from "@/components/ui/barberlyticsLogoPaths";
import { buildBarberlyticsFavicon, faviconDataUrl, type FaviconStops } from "@/components/ui/barberlyticsFavicon";
import { buildBarberlyticsAppIcon, rasterizeSvg } from "@/components/ui/barberlyticsLogoSvg";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy } from "../hooks/useCopy";
import { Heading, Text } from "@/components/typography";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { buildThemeTokens, THEME_PRESETS, ThemeSwatch, useTheme, type ResolvedMode, type ThemePreset, type ThemeTokens } from "@/themes";
import { CodeBlock } from "../components/CodeBlock";
import { DocSection, PageIntro } from "../components/PageIntro";
import { BrandDownloads } from "./brand/BrandDownloads";
import { TenantBrandSection } from "./brand/TenantBrandSection";

/*
 * Medidas reales del logotipo (Nunito ExtraBlack vectorizada), todas en
 * `LOGO_METRICS`. La «x» es la altura de la «B»; la punta de la flecha llega a
 * la altura de las minúsculas y el pulso baja 1 x por debajo de la línea base.
 */
const M = LOGO_METRICS;
/** Trazos y rótulos de las figuras, proporcionales al ancho del logotipo para valer con cualquier lienzo. */
const W = WORDMARK_BOX.w;
const FIG = { label: W * 0.0148, stroke: W * 0.0013, dash: `${W * 0.006} ${W * 0.006}`, gap: W * 0.02, labelWidth: W * 0.27 };

function tokensToStyle(tokens: ThemeTokens): React.CSSProperties {
  return tokens as unknown as React.CSSProperties;
}

/** Un recuadro con los tokens de un preset y un modo, para ver el logo en ese contexto. */
function ModePanel({ preset, mode, children, className = "" }: { preset: ThemePreset; mode: ResolvedMode; children: React.ReactNode; className?: string }) {
  const tokens = React.useMemo(() => buildThemeTokens(preset, mode), [preset, mode]);
  return (
    <div
      className={cn("docs-preview relative flex min-h-36 items-center justify-center rounded-xl border p-6", className)}
      style={{ ...tokensToStyle(tokens), background: "var(--color-bg-app)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
    >
      <span className="absolute left-3 top-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-text-muted)" }}>
        {mode === "light" ? "Claro" : "Oscuro"}
      </span>
      {children}
    </div>
  );
}

function BothModes({ preset, children }: { preset: ThemePreset; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ModePanel preset={preset} mode="light">
        {children}
      </ModePanel>
      <ModePanel preset={preset} mode="dark">
        {children}
      </ModePanel>
    </div>
  );
}

const MEANING = [
  {
    piece: "Barber",
    title: "El oficio",
    text: "Va en tinta sólida, en el color del texto del tema. Es la parte que no cambia: el nombre del negocio, con el peso de una firma.",
  },
  {
    piece: "lytics",
    title: "La lectura",
    text: "Lleva el color del tema. Es la capa que Barberlytics añade sobre el oficio: los datos que dicen cómo va el negocio.",
  },
  {
    piece: "la flecha",
    title: "Salud y crecimiento",
    text: "Un pulso, como el de un monitor: el latido del negocio. Baja antes de subir —hay semanas malas— y remonta hasta la punta: la tendencia es hacia arriba.",
  },
];

const RULES = {
  do: [
    "Colócalo sobre el fondo de la app o de una superficie; el color lo pone el tema.",
    "Deja alrededor, como mínimo, el alto de la «B» (0,5 × la altura del logo).",
    "Usa el logotipo completo a partir de 20px de alto y la flecha sola a partir de 16px.",
    "En el cromo oscuro (rail, cabecera) usa el contenedor con text-nav-foreground.",
    "Usa gradient=\"mono\" cuando el gradiente no exista: grabado, una tinta, un icono de sistema.",
  ],
  dont: [
    "No lo estires ni lo gires: cambia solo height.",
    "No le pongas un color a mano ni lo saques del tema.",
    "No uses gradient=\"ai\" fuera de una superficie de IA: es la gradación de la IA, no la de la marca.",
    "No separes «lytics» de «Barber» ni uses la flecha con el texto en otra tipografía.",
    "No lo pongas sobre fotos o gradientes de fondo: pierde el pulso.",
  ],
};

const GRADIENTS: { id: BarberlyticsLogoGradient; title: string; text: string }[] = [
  { id: "brand", title: "Marca (por defecto)", text: "--color-brand-gradient: el mismo degradado del botón primario del tema. Es el logo de todos los días." },
  { id: "ai", title: "Gradación de IA", text: "--color-ai-stop-1…5: la malla que cada tema define para la IA. Solo en el agente, en los insights y en lo que la IA genera." },
  { id: "mono", title: "Una tinta", text: "currentColor: todo el logo en el color del texto. Para grabados, sellos, iconos del sistema y cualquier sitio sin gradiente." },
];

const USAGE_CODE = `import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo";

// En la cabecera: hereda el color del texto y el gradiente del tema.
<div className="text-text-primary">
  <BarberlyticsLogo height={24} />
</div>

// Sobre el cromo oscuro del rail.
<div className="bg-surface-nav text-nav-foreground">
  <BarberlyticsLogo height={20} />
</div>

// La flecha sola: favicon, avatar, icono de app.
<BarberlyticsLogo variant="mark" height={16} />

// Solo en superficies de IA.
<BarberlyticsLogo gradient="ai" />`;

/** Anatomía: las tres piezas y las guías de altura. */
function AnatomyFigure() {
  const guide = (y: number, label: string) => (
    <g>
      <line x1={M.left - FIG.gap} x2={M.right + FIG.gap} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.35} strokeWidth={FIG.stroke} strokeDasharray={FIG.dash} />
      <text x={M.right + FIG.gap * 1.5} y={y + FIG.label / 3} fontSize={FIG.label} fill="currentColor" fillOpacity={0.75}>
        {label}
      </text>
    </g>
  );
  return (
    <svg
      viewBox={`${M.left - FIG.gap * 3} ${WORDMARK_BOX.y - FIG.gap * 2} ${W + FIG.gap * 4.5 + FIG.labelWidth} ${WORDMARK_BOX.h + FIG.gap * 4}`}
      className="w-full text-text-secondary" role="img" aria-label="Anatomía del logotipo: altura de mayúscula, altura de las minúsculas, línea base y fondo del pulso">
      <path d={BARBER_PATH} fill="currentColor" fillOpacity={0.28} />
      <path d={LYTICS_PATH} fill="currentColor" fillOpacity={0.55} />
      <path d={ARROW_PATH} fill="var(--color-brand)" />
      {guide(M.capTop, "mayúsculas · x")}
      {guide(M.xHeight, "minúsculas · punta de la flecha")}
      {guide(M.baseline, "línea base")}
      {guide(M.pulseBottom, "fondo del pulso · −1 x")}
      <line x1={M.left - FIG.gap} x2={M.left - FIG.gap} y1={M.capTop} y2={M.baseline} stroke="var(--color-brand)" strokeWidth={FIG.stroke * 1.5} />
      <text x={M.left - FIG.gap * 1.6} y={(M.capTop + M.baseline) / 2 + FIG.label / 3} fontSize={FIG.label} fill="var(--color-brand)" textAnchor="end" fontWeight={700}>
        x
      </text>
    </svg>
  );
}

/** Espacio de respeto: un «x» (la altura de la «B») por cada lado. */
function ClearSpaceFigure() {
  const pad = LOGO_X;
  const box = { x: WORDMARK_BOX.x - pad, y: WORDMARK_BOX.y - pad, w: WORDMARK_BOX.w + pad * 2, h: WORDMARK_BOX.h + pad * 2 };
  const corners = [
    [box.x, box.y],
    [box.x + box.w - pad, box.y],
    [box.x, box.y + box.h - pad],
    [box.x + box.w - pad, box.y + box.h - pad],
  ];
  return (
    <svg viewBox={`${box.x - FIG.gap} ${box.y - FIG.gap} ${box.w + FIG.gap * 2} ${box.h + FIG.gap * 2}`} className="w-full text-text-secondary" role="img" aria-label="Espacio de respeto alrededor del logotipo">
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="currentColor" strokeOpacity={0.4} strokeWidth={FIG.stroke} strokeDasharray={FIG.dash} />
      {corners.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={pad} height={pad} fill="var(--color-brand)" fillOpacity={0.12} stroke="var(--color-brand)" strokeOpacity={0.5} strokeWidth={FIG.stroke / 2} />
      ))}
      <path d={BARBER_PATH} fill="currentColor" />
      <path d={LYTICS_PATH} fill="currentColor" fillOpacity={0.6} />
      <path d={ARROW_PATH} fill="currentColor" fillOpacity={0.6} />
    </svg>
  );
}

function PresetCard({ preset }: { preset: ThemePreset }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <ThemeSwatch preset={preset} className="size-4" />
        <Text as="span" weight="semibold">
          {preset.name}
        </Text>
      </div>
      <div className="grid sm:grid-cols-2">
        {(["light", "dark"] as const).map((mode) => (
          <ModePanel key={mode} preset={preset} mode={mode} className="min-h-32 rounded-none border-0 first:border-b sm:first:border-b-0 sm:first:border-r">
            <div className="flex flex-col items-center gap-4">
              <BarberlyticsLogo height={30} />
              <div className="flex items-center gap-5">
                <BarberlyticsLogo variant="mark" height={20} />
                <BarberlyticsLogo variant="mark" height={20} gradient="ai" />
                <BarberlyticsLogo variant="mark" height={20} gradient="mono" />
              </div>
            </div>
          </ModePanel>
        ))}
      </div>
    </Card>
  );
}

const FAVICON_LINK = `<!-- index.html -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;

function brandStops(tokens: ThemeTokens): FaviconStops {
  return [tokens["--color-brand-gradient-from"], tokens["--color-brand-gradient-via"], tokens["--color-brand-gradient-to"]];
}

/** Una pestaña de navegador con el favicon real (el SVG como `<img>`), en el claro o el oscuro del tema. */
function BrowserTab({ preset, mode, src }: { preset: ThemePreset; mode: ResolvedMode; src: string }) {
  return (
    <ModePanel preset={preset} mode={mode} className="min-h-0 flex-col items-stretch justify-start overflow-hidden p-0 pt-8">
      <div className="flex items-end gap-1 bg-surface-muted px-3 pt-2">
        <div className="flex min-w-0 items-center gap-2 rounded-t-lg bg-surface px-3 py-2">
          <img src={src} width={16} height={16} alt="" className="shrink-0" />
          <Text as="span" size="xs" truncate>
            Barberlytics · Agenda
          </Text>
          <ThemaIcon name="close" size="xs" tone="muted" />
        </div>
        <div className="flex min-w-0 items-center gap-2 px-3 py-2 opacity-60">
          <span className="size-4 shrink-0 rounded-full bg-border" />
          <Text as="span" size="xs" tone="muted" truncate>
            Otra pestaña
          </Text>
        </div>
      </div>
      <div className="flex items-center bg-surface px-3 py-2">
        <div className="flex w-full items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5">
          <ThemaIcon name="search" size="xs" tone="muted" />
          <Text as="span" size="xs" tone="muted" truncate>
            app.barberlytics.com/agenda
          </Text>
        </div>
      </div>
    </ModePanel>
  );
}

const APPLE_TOUCH_SIZE = 180;

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function FaviconSection({ preset }: { preset: ThemePreset }) {
  const { copied, copy } = useCopy();
  const favicon = React.useMemo(() => {
    // La versión oficial: el cuadro con las paradas del modo oscuro (las claras,
    // champán en Premium) y la flecha en el fondo de ese modo.
    const dark = buildThemeTokens(preset, "dark");
    const stops = brandStops(dark);
    const arrow = dark["--color-bg-app"];
    const svg = buildBarberlyticsFavicon({ stops, arrow });
    return { stops, arrow, svg, url: faviconDataUrl(svg) };
  }, [preset]);

  const downloadPng = async () => {
    try {
      saveBlob(await rasterizeSvg(buildBarberlyticsAppIcon({ fill: favicon.stops, arrow: favicon.arrow, size: APPLE_TOUCH_SIZE })), "apple-touch-icon.png");
    } catch (error) {
      toast.error("No se pudo generar el PNG", { description: error instanceof Error ? error.message : undefined });
    }
  };

  return (
    <DocSection
      id="favicon"
      title="Favicon e icono de app"
      description="La flecha en carbón sobre un cuadro redondeado con el gradiente de marca en su versión clara (champán en Premium). A 16 px una línea fina sobre la barra de pestañas se pierde; el cuadro trae su propio fondo, así que se lee igual en pestañas claras y oscuras y sirve tal cual como icono de app."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <BrowserTab preset={preset} mode="light" src={favicon.url} />
        <BrowserTab preset={preset} mode="dark" src={favicon.url} />
      </div>

      <Card className="space-y-6 p-card">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
          {[16, 32, 48, 64, 96].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <img src={favicon.url} width={size} height={size} alt={`Icono a ${size}px`} />
              <Text as="span" size="xs" tone="muted" tabular>
                {size}px
              </Text>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <Button size="sm" onClick={() => saveBlob(new Blob([favicon.svg], { type: "image/svg+xml" }), "favicon.svg")}>
            <ThemaIcon name="download" size="sm" />
            favicon.svg
          </Button>
          <Button size="sm" variant="outline" onClick={() => void downloadPng()}>
            <ThemaIcon name="download" size="sm" />
            apple-touch-icon.png
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy(favicon.svg)}>
            <ThemaIcon name={copied ? "check" : "code"} size="sm" />
            {copied ? "Copiado" : "Copiar SVG"}
          </Button>
          <Text as="span" size="xs" tone="muted">
            Con el tema {preset.name}. Cambia el tema en la cabecera para bajar el de otro.
          </Text>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-1 p-card">
          <Heading level={5}>El de la app</Heading>
          <Text tone="secondary">
            public/favicon.svg y public/apple-touch-icon.png van en el champán de Premium con la flecha carbón, el color de la marca: como el logo del menú, no cambian con el tema que
            elija cada persona.
          </Text>
        </Card>
        <Card className="space-y-1 p-card">
          <Heading level={5}>Proporción</Heading>
          <Text tone="secondary">
            La flecha ocupa el 72% del ancho del cuadro y las esquinas redondean al 22% del lado, como los iconos de iOS y Android. No se recorta ni se
            gira.
          </Text>
        </Card>
        <Card className="space-y-1 p-card">
          <Heading level={5}>Safari e iOS</Heading>
          <Text tone="secondary">
            No usan el SVG para la pantalla de inicio: piden un PNG de 180 × 180. Es el mismo icono rasterizado; se descarga con el segundo botón.
          </Text>
        </Card>
      </div>

      <CodeBlock code={FAVICON_LINK} language="html" />
    </DocSection>
  );
}

const NUNITO_STYLESHEET = "https://fonts.googleapis.com/css2?family=Nunito:wght@1000&display=swap";
const NUNITO_LINK_ID = "brand-font-nunito-extrablack";
const LOGO_FONT: React.CSSProperties = { fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 1000 };

const TYPEFACE_FACTS = [
  { label: "Familia", value: "Nunito" },
  { label: "Estilo", value: "ExtraBlack · peso 1000" },
  { label: "Diseño", value: "Vernon Adams, Cyreal y Jacques Le Bailly" },
  { label: "Licencia", value: "SIL Open Font License: libre, también para uso comercial" },
  { label: "Dónde", value: "Google Fonts (fonts.google.com/specimen/Nunito)" },
];

/** La ficha de la fuente del logotipo, con un espécimen en vivo: carga Nunito 1000 solo en esta página. */
function LogoTypeface() {
  React.useEffect(() => {
    if (document.getElementById(NUNITO_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = NUNITO_LINK_ID;
    link.rel = "stylesheet";
    link.href = NUNITO_STYLESHEET;
    document.head.appendChild(link);
  }, []);

  return (
    <Card className="grid gap-6 p-card md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <div className="min-w-0 space-y-4 text-text-primary">
        <Text variant="small" tone="muted">
          La fuente del logotipo
        </Text>
        <p className="truncate text-5xl leading-none tracking-tight" style={LOGO_FONT}>
          Barberlytics
        </p>
        <p className="text-2xl leading-snug" style={LOGO_FONT}>
          Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
        </p>
        <p className="text-2xl leading-snug" style={LOGO_FONT}>
          0123456789 · ¿? ¡! & %
        </p>
      </div>
      <dl className="space-y-3 md:border-l md:border-border/60 md:pl-6">
        {TYPEFACE_FACTS.map((fact) => (
          <div key={fact.label}>
            <dt>
              <Text as="span" variant="small" tone="muted">
                {fact.label}
              </Text>
            </dt>
            <dd>
              <Text as="span" weight="medium">
                {fact.value}
              </Text>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function BrandPage() {
  const { preset } = useTheme();
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Fundamentos"
        title="Marca"
        description="El logotipo de Barberlytics no es una imagen que se pega: es un componente del sistema que sigue al tema y al modo, como un botón. «Barber» va en el color del texto, «lytics» y la flecha en el gradiente del tema activo. Esta página cuenta qué dice, cómo está construido y cómo se usa."
      />

      <DocSection id="logo" title="El logotipo" description="Tal como se ve ahora, con el tema y el modo que tienes activos. Cambia el tema en la cabecera y el logo cambia con él.">
        <Card className="flex items-center justify-center p-12 text-text-primary">
          <BarberlyticsLogo height={72} className="max-w-full" />
        </Card>
        <BothModes preset={preset}>
          <BarberlyticsLogo height={36} />
        </BothModes>
      </DocSection>

      <DocSection id="significado" title="Qué dice" description="Tres piezas, una historia: el oficio, la lectura de los datos y la salud del negocio.">
        <div className="grid gap-4 md:grid-cols-3">
          {MEANING.map((item) => (
            <Card key={item.piece} className="space-y-2 p-card">
              <Text variant="small" tone="primary" weight="semibold">
                {item.piece}
              </Text>
              <Heading level={4}>{item.title}</Heading>
              <Text tone="secondary">{item.text}</Text>
            </Card>
          ))}
        </div>
        <Card className="space-y-3 p-card">
          <Heading level={5}>Por qué un pulso y no una gráfica</Heading>
          <Text tone="secondary">
            Una línea de gráfica es un resultado; un pulso es una señal de vida. La flecha de Barberlytics arranca plana, cae, sube con fuerza, vuelve a caer y
            termina subiendo por encima de donde empezó. Es lo que le pasa a un negocio que va bien: no sube todos los días, pero sube. Por eso la flecha no se
            gira ni se invierte —un pulso al revés no significa nada— y por eso lleva siempre el color vivo del tema y no la tinta del texto.
          </Text>
        </Card>
      </DocSection>

      <DocSection id="construccion" title="Cómo está construido" description="Todo se mide en «x», la altura de la «B». El logo completo mide 8,9 x de ancho por 2 x de alto; la flecha sola, 2,5 x por 1,7 x.">
        <Card className="p-card text-text-primary">
          <AnatomyFigure />
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="space-y-1 p-card">
            <Text variant="small" tone="muted">
              La punta llega
            </Text>
            <Heading level={3}>a las minúsculas</Heading>
            <Text tone="secondary">La flecha termina a la altura de la «a» y la «c»: remata el nombre sin competir con la «B» ni con la «l».</Text>
          </Card>
          <Card className="space-y-1 p-card">
            <Text variant="small" tone="muted">
              El pulso baja
            </Text>
            <Heading level={3}>1 x</Heading>
            <Text tone="secondary">por debajo de la línea base, más que el descendente de la «y». Arranca bajo la «i» y por eso el logo necesita aire abajo.</Text>
          </Card>
          <Card className="space-y-1 p-card">
            <Text variant="small" tone="muted">
              Espacio de respeto
            </Text>
            <Heading level={3}>1 x</Heading>
            <Text tone="secondary">por cada lado, libre de texto, iconos y bordes. En el componente equivale a 0,5 × height.</Text>
          </Card>
        </div>
        <Card className="p-card text-text-primary">
          <ClearSpaceFigure />
        </Card>
      </DocSection>

      <DocSection id="tipografia" title="Tipografía" description="«Barberlytics» está escrito en Nunito ExtraBlack (peso 1000), un palo seco de terminales redondeados, y vectorizado: en el logotipo no es texto, así que se ve igual en todas partes aunque la fuente no esté instalada.">
        <LogoTypeface />
        <Card className="space-y-6 p-card">
          <div className="flex flex-wrap items-end gap-x-10 gap-y-6 text-text-primary">
            <div className="space-y-2">
              <Text variant="small" tone="muted">
                El logotipo (dibujo)
              </Text>
              <BarberlyticsLogo height={40} gradient="mono" />
            </div>
            <div className="space-y-2">
              <Text variant="small" tone="muted">
                El nombre en la tipografía del tema (texto)
              </Text>
              <Heading level={1} as="p" weight="bold">
                Barberlytics
              </Heading>
            </div>
          </div>
          <Text tone="secondary">
            La interfaz cambia de fuente con el tema (--font-body, --font-heading); el logotipo no, y esa es la diferencia que lo hace marca. Cuando el
            nombre aparece en una frase —un título, un correo, una migaja— se escribe «Barberlytics» en la tipografía del tema, como cualquier palabra. Nunca se
            escribe el nombre en negrita intentando parecerse al logo, ni se usa el logo dentro de una línea de texto. Nunito ExtraBlack es la
            letra de la marca: para piezas gráficas (carteles, redes, presentaciones), no para la interfaz.
          </Text>
        </Card>
      </DocSection>

      <DocSection id="color" title="Color: el logo sigue al tema" description="Tres formas de pintar «lytics» y la flecha; «Barber» siempre va en currentColor, que en la app es el color del texto del modo.">
        <div className="space-y-6">
          {GRADIENTS.map((item) => (
            <div key={item.id} className="space-y-3">
              <div>
                <Heading level={4}>{item.title}</Heading>
                <Text tone="secondary">{item.text}</Text>
              </div>
              <BothModes preset={preset}>
                <BarberlyticsLogo height={36} gradient={item.id} />
              </BothModes>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="temas" title="En los diez temas" description="Cada tema pinta el logo con su propio primario y su propia gradación de IA. En cada recuadro: el logotipo con el gradiente de marca y, debajo, la flecha en marca, en IA y en una tinta.">
        <div className="grid gap-4 lg:grid-cols-2">
          {THEME_PRESETS.map((item) => (
            <PresetCard key={item.id} preset={item} />
          ))}
        </div>
      </DocSection>

      <DocSection id="isotipo" title="El isotipo: la flecha sola" description="Cuando no cabe el nombre, queda el pulso. Funciona desde 16px porque no tiene detalle fino: una línea gruesa y una punta.">
        <Card className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 p-8 text-text-primary">
          <div className="flex items-center gap-3 rounded-t-lg border border-border/60 bg-surface px-3 py-2 shadow-sm">
            <BarberlyticsLogo variant="mark" height={14} />
            <Text as="span" size="xs">
              Barberlytics
            </Text>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-surface shadow-md">
            <BarberlyticsLogo variant="mark" height={26} />
          </div>
          <div className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-surface-subtle">
            <BarberlyticsLogo variant="mark" height={18} />
          </div>
          <div className="flex items-end gap-5">
            {[16, 24, 32, 48].map((height) => (
              <BarberlyticsLogo key={height} variant="mark" height={height} />
            ))}
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="space-y-1 p-card">
            <Heading level={5}>Favicon y pestaña</Heading>
            <Text tone="secondary">La flecha sola a 16px, con el gradiente de marca. Tiene su propia sección justo debajo, con el archivo listo para descargar.</Text>
          </Card>
          <Card className="space-y-1 p-card">
            <Heading level={5}>Icono de app y avatar</Heading>
            <Text tone="secondary">Para eso está el icono de app: la flecha sobre un cuadro redondeado con el color de marca, que trae su propio fondo. Se descarga abajo.</Text>
          </Card>
          <Card className="space-y-1 p-card">
            <Heading level={5}>Lo que no es</Heading>
            <Text tone="secondary">No es un icono más: no va en botones ni en listas junto a otros iconos, y nunca acompaña a «lytics» sin «Barber».</Text>
          </Card>
        </div>
      </DocSection>

      <FaviconSection preset={preset} />

      <TenantBrandSection />

      <BrandDownloads />

      <DocSection id="usos" title="Sí y no">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3 p-card">
            <Heading level={5}>Sí</Heading>
            <ul className="space-y-2">
              {RULES.do.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <ThemaIcon name="check" size="sm" tone="positive" className="mt-0.5" />
                  <Text as="span" tone="secondary">
                    {rule}
                  </Text>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="space-y-3 p-card">
            <Heading level={5}>No</Heading>
            <ul className="space-y-2">
              {RULES.dont.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <ThemaIcon name="close" size="sm" tone="negative" className="mt-0.5" />
                  <Text as="span" tone="secondary">
                    {rule}
                  </Text>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </DocSection>

      <DocSection id="codigo" title="En código" description="Un solo componente para todo: sin props de color, el contexto decide. La ficha completa, con playground, está en Primitivos → BarberlyticsLogo.">
        <CodeBlock code={USAGE_CODE} />
      </DocSection>
    </div>
  );
}
