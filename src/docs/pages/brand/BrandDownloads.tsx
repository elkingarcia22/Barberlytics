import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildBarberlyticsAppIcon, buildBarberlyticsLogoSvg, rasterizeSvg, svgDataUrl, type LogoSvg } from "@/components/ui/barberlyticsLogoSvg";
import type { BarberlyticsLogoGradient, BarberlyticsLogoVariant } from "@/components/ui/BarberlyticsLogo";
import { Field } from "@/components/forms";
import { SingleSelect } from "@/components/forms/SingleSelect";
import { SegmentedControl } from "@/components/selection";
import { Heading, Text } from "@/components/typography";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { createZip, type ZipEntry } from "@/lib/zip";
import { buildThemeTokens, findPreset, THEME_PRESETS, type ResolvedMode, type ThemePreset, type ThemeTokens } from "@/themes";
import { DocSection } from "../../components/PageIntro";

type Backdrop = "solid" | "transparent";
type Piece = BarberlyticsLogoVariant | "appIcon";

interface Variation {
  piece: Piece;
  tint: BarberlyticsLogoGradient;
  mode: ResolvedMode;
  backdrop: Backdrop;
}

interface Palette {
  ink: string;
  background: string;
  brand: string[];
  ai: string[];
  tokens: ThemeTokens;
}

const OFFICIAL_PRESET = "premium";
const SIZES = [1024, 2048, 4096];
const DEFAULT_SIZE = 2048;
const PREVIEW_WIDTH = 640;

const PIECES: { id: Piece; label: string; slug: string; text: string }[] = [
  { id: "wordmark", label: "Logotipo", slug: "logotipo", text: "El logo completo, con el espacio de respeto (1 x) alrededor. Para cabeceras, documentos, presentaciones y firmas." },
  { id: "mark", label: "Isotipo", slug: "isotipo", text: "La flecha sola en un lienzo cuadrado, sobre el fondo que le pongas. Para piezas impresas, redes y firmas." },
  {
    id: "appIcon",
    label: "Icono de app",
    slug: "icono-app",
    text: "La flecha sobre su propio cuadro redondeado, con las esquinas transparentes. Para pantalla de inicio, tiendas de apps, avatar y favicon.",
  },
];

const TINTS: { id: BarberlyticsLogoGradient; label: string; slug: string }[] = [
  { id: "brand", label: "Marca", slug: "marca" },
  { id: "ai", label: "Gradación de IA", slug: "ia" },
  { id: "mono", label: "Una tinta", slug: "una-tinta" },
];

const MODES: { id: ResolvedMode; label: string; slug: string }[] = [
  { id: "light", label: "Claro", slug: "claro" },
  { id: "dark", label: "Oscuro", slug: "oscuro" },
];

const BACKDROPS: { id: Backdrop; label: string; slug: string }[] = [
  { id: "solid", label: "con fondo", slug: "fondo" },
  { id: "transparent", label: "transparente", slug: "transparente" },
];

/** El icono de app lleva su propio fondo: no tiene versión «con fondo». */
const backdropsFor = (piece: Piece) => (piece === "appIcon" ? BACKDROPS.filter((item) => item.id === "transparent") : BACKDROPS);

const VARIATIONS: readonly Variation[] = PIECES.flatMap(({ id: piece }) =>
  TINTS.flatMap(({ id: tint }) => MODES.flatMap(({ id: mode }) => backdropsFor(piece).map(({ id: backdrop }) => ({ piece, tint, mode, backdrop }))))
);

const slugOf = <T extends { id: string; slug: string }>(list: readonly T[], id: string) => list.find((item) => item.id === id)?.slug ?? id;
const labelOf = <T extends { id: string; label: string }>(list: readonly T[], id: string) => list.find((item) => item.id === id)?.label ?? id;

function paletteFor(preset: ThemePreset, mode: ResolvedMode): Palette {
  const tokens = buildThemeTokens(preset, mode);
  return {
    tokens,
    ink: tokens["--color-text-primary"],
    background: tokens["--color-bg-app"],
    brand: ["--color-brand-gradient-from", "--color-brand-gradient-via", "--color-brand-gradient-to"].map((name) => tokens[name]),
    ai: [1, 2, 3, 4, 5].map((n) => tokens[`--color-ai-stop-${n}`]),
  };
}

function logoFor(variation: Variation, palette: Palette, width: number): LogoSvg {
  const stops = variation.tint === "brand" ? palette.brand : variation.tint === "ai" ? palette.ai : [];
  if (variation.piece === "appIcon") {
    // En una tinta el cuadro es la tinta del texto. La flecha contrasta con el
    // cuadro: blanca (la superficie clara) sobre las paradas oscuras del modo
    // claro, y del color del fondo oscuro sobre las paradas claras del oscuro.
    const fill = stops.length > 1 ? stops : [palette.ink];
    const arrow = variation.mode === "light" && stops.length > 1 ? palette.tokens["--color-surface"] : palette.background;
    return buildBarberlyticsAppIcon({ fill, arrow, size: width });
  }
  return buildBarberlyticsLogoSvg({
    variant: variation.piece,
    ink: palette.ink,
    stops,
    background: variation.backdrop === "solid" ? palette.background : null,
    width,
  });
}

function fileName(variation: Variation, presetId: string, width: number, extension: "png" | "svg") {
  const parts = [
    "barberlytics",
    presetId,
    slugOf(PIECES, variation.piece),
    slugOf(TINTS, variation.tint),
    slugOf(MODES, variation.mode),
    slugOf(BACKDROPS, variation.backdrop),
  ];
  return `${parts.join("-")}${extension === "png" ? `-${width}px` : ""}.${extension}`;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** El navegador codifica cada PNG fuera del hilo principal: varios a la vez tardan casi lo mismo que uno. */
const PARALLEL_RENDERS = 4;

async function mapLimited<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Error desconocido.");

/** Damero con los tokens del modo: así se ve qué parte del PNG es transparente. */
const CHECKER: React.CSSProperties = {
  backgroundImage:
    "conic-gradient(var(--color-surface-muted) 25%, var(--color-surface) 0 50%, var(--color-surface-muted) 0 75%, var(--color-surface) 0)",
  backgroundSize: "16px 16px",
};

interface DownloadTileProps {
  variation: Variation;
  palette: Palette;
  /** Este PNG se está generando. */
  rendering: boolean;
  /** Hay otra generación en curso (otro PNG o el .zip). */
  locked: boolean;
  onPng: () => void;
  onSvg: () => void;
}

function DownloadTile({ variation, palette, rendering, locked, onPng, onSvg }: DownloadTileProps) {
  const preview = React.useMemo(() => svgDataUrl(logoFor(variation, palette, PREVIEW_WIDTH).svg), [variation, palette]);
  const solid = variation.backdrop === "solid";
  const caption = `${labelOf(MODES, variation.mode)} · ${labelOf(BACKDROPS, variation.backdrop)}`;
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div
        className="flex h-28 items-center justify-center p-3"
        style={{ ...(palette.tokens as unknown as React.CSSProperties), ...(solid ? { background: palette.background } : CHECKER) }}
      >
        <img src={preview} alt={`Barberlytics, ${labelOf(PIECES, variation.piece)} ${labelOf(TINTS, variation.tint)}, ${caption}`} className="max-h-full max-w-full" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-surface px-3 py-2">
        <Text as="span" size="xs" tone="secondary" truncate>
          {caption}
        </Text>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onSvg} aria-label={`Descargar SVG, ${caption}`}>
            SVG
          </Button>
          <Button size="sm" variant="outline" onClick={onPng} disabled={locked} aria-label={`Descargar PNG, ${caption}`}>
            <ThemaIcon name="download" size="xs" />
            {rendering ? "Generando…" : "PNG"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * El kit de marca: las 24 variantes del logo (pieza × color × modo × fondo)
 * en PNG a la resolución elegida y en SVG, una a una o todas en un .zip.
 * Los colores salen de `buildThemeTokens`, así el PNG es el tema real.
 */
export function BrandDownloads() {
  const [presetId, setPresetId] = React.useState(OFFICIAL_PRESET);
  const [width, setWidth] = React.useState(DEFAULT_SIZE);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);

  const preset = findPreset(presetId);
  const palettes = React.useMemo(() => ({ light: paletteFor(preset, "light"), dark: paletteFor(preset, "dark") }), [preset]);
  const presetOptions = React.useMemo(
    () => THEME_PRESETS.map((item) => ({ value: item.id, label: item.id === OFFICIAL_PRESET ? `${item.name} · marca oficial` : item.name })),
    []
  );
  const sample = {
    wordmark: logoFor({ piece: "wordmark", tint: "brand", mode: "light", backdrop: "solid" }, palettes.light, width),
    mark: logoFor({ piece: "mark", tint: "brand", mode: "light", backdrop: "solid" }, palettes.light, width),
  };

  const downloadPng = async (variation: Variation) => {
    const name = fileName(variation, preset.id, width, "png");
    setBusyKey(name);
    try {
      saveBlob(await rasterizeSvg(logoFor(variation, palettes[variation.mode], width)), name);
    } catch (error) {
      toast.error("No se pudo generar el PNG", { description: errorMessage(error) });
    } finally {
      setBusyKey(null);
    }
  };

  const downloadSvg = (variation: Variation) => {
    const { svg } = logoFor(variation, palettes[variation.mode], width);
    saveBlob(new Blob([svg], { type: "image/svg+xml" }), fileName(variation, preset.id, width, "svg"));
  };

  const downloadAll = async () => {
    const encoder = new TextEncoder();
    setProgress(0);
    try {
      let done = 0;
      const pngs = await mapLimited(VARIATIONS, PARALLEL_RENDERS, async (variation) => {
        const png = await rasterizeSvg(logoFor(variation, palettes[variation.mode], width));
        done += 1;
        setProgress(done);
        return new Uint8Array(await png.arrayBuffer());
      });
      const entries: ZipEntry[] = [
        ...VARIATIONS.map((variation, index) => ({ name: `png/${fileName(variation, preset.id, width, "png")}`, data: pngs[index] })),
        ...VARIATIONS.map((variation) => ({
          name: `svg/${fileName(variation, preset.id, width, "svg")}`,
          data: encoder.encode(logoFor(variation, palettes[variation.mode], width).svg),
        })),
      ];
      saveBlob(new Blob([createZip(entries)], { type: "application/zip" }), `barberlytics-marca-${preset.id}-${width}px.zip`);
      toast.success("Kit de marca descargado", { description: `${VARIATIONS.length} PNG a ${width} px y sus SVG, tema ${preset.name}.` });
    } catch (error) {
      toast.error("No se pudo generar el kit", { description: errorMessage(error) });
    } finally {
      setProgress(null);
    }
  };

  return (
    <DocSection
      id="descargas"
      title="Descargas"
      description="Todas las versiones del logo en PNG, con fondo o transparentes, a la resolución que necesites, y en SVG. Los colores son los tokens reales del tema que elijas; por defecto, Premium, el de la marca oficial."
    >
      <Card className="space-y-4 p-card">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Field label="Tema">
            <SingleSelect options={presetOptions} value={presetId} onValueChange={setPresetId} className="w-56" />
          </Field>
          <SegmentedControl
            label="Ancho del PNG"
            size="sm"
            options={SIZES.map((size) => ({ value: String(size), label: `${size} px` }))}
            value={String(width)}
            onChange={(value) => setWidth(Number(value))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Text as="span" size="xs" tone="muted" tabular>
            {VARIATIONS.length} PNG + {VARIATIONS.length} SVG · logotipo {sample.wordmark.width} × {sample.wordmark.height} px · isotipo e icono de app{" "}
            {sample.mark.width} × {sample.mark.height} px
          </Text>
          <Button onClick={downloadAll} disabled={progress !== null}>
            <ThemaIcon name="download" size="sm" />
            {progress === null ? "Descargar todo (.zip)" : `Generando ${progress} de ${VARIATIONS.length}…`}
          </Button>
        </div>
      </Card>

      <div className="space-y-8">
        {PIECES.map((piece) => (
          <div key={piece.id} className="space-y-4">
            <div>
              <Heading level={4}>{piece.label}</Heading>
              <Text tone="secondary">{piece.text}</Text>
            </div>
            {TINTS.map((tint) => (
              <div key={tint.id} className="space-y-2">
                <Heading level={6}>{tint.label}</Heading>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {VARIATIONS.filter((item) => item.piece === piece.id && item.tint === tint.id).map((variation) => (
                    <DownloadTile
                      key={`${variation.mode}-${variation.backdrop}`}
                      variation={variation}
                      palette={palettes[variation.mode]}
                      rendering={busyKey === fileName(variation, preset.id, width, "png")}
                      locked={busyKey !== null || progress !== null}
                      onPng={() => downloadPng(variation)}
                      onSvg={() => downloadSvg(variation)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Text size="xs" tone="muted">
        Claro = «Barber» en tinta oscura, para fondos claros. Oscuro = «Barber» en tinta clara, para fondos oscuros. El PNG con fondo usa el fondo de la app
        de ese modo; el transparente lleva el mismo aire de respeto, sin nada detrás.
      </Text>
    </DocSection>
  );
}
