import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GlassIcon,
  ThemaIcon,
  iconRegistry,
  type GlassSize,
  type GlassTone,
  type IconName,
  type IconSize,
  type IconTone,
} from "@/icons";
import { CodeBlock } from "../components/CodeBlock";
import { useCopy } from "../hooks/useCopy";
import { DocSection, PageIntro } from "../components/PageIntro";

const ICON_NAMES = Object.keys(iconRegistry) as IconName[];
const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
const TONES: IconTone[] = ["default", "muted", "primary", "positive", "negative", "warning", "info"];
const GLASS_TONES: GlassTone[] = ["violet", "blue", "green", "orange", "rose", "amber", "teal", "brand"];
const GLASS_SIZES: GlassSize[] = [48, 64, 96];

function IconTile({ name }: { name: IconName }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(`<ThemaIcon name="${name}" />`)}
      title={`Copiar <ThemaIcon name="${name}" />`}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-surface p-3 shadow-card transition-colors hover:border-primary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      <span className="relative flex size-10 items-center justify-center rounded-lg bg-surface-subtle text-text-primary group-hover:text-primary">
        <ThemaIcon name={name} size="md" />
        {copied && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
        )}
      </span>
      <span className="w-full truncate text-center font-mono text-[10.5px] text-text-secondary">{name}</span>
    </button>
  );
}

function GlassTile({ name, tone, size }: { name: IconName; tone: GlassTone; size: GlassSize }) {
  const { copied, copy } = useCopy();
  const snippet = `<GlassIcon name="${name}" tone="${tone}"${size === 64 ? "" : ` size={${size}}`} />`;
  return (
    <button
      type="button"
      onClick={() => copy(snippet)}
      title={`Copiar ${snippet}`}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface p-4 shadow-card transition-colors hover:border-primary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      <GlassIcon name={name} tone={tone} size={size} />
      <span className="w-full truncate text-center font-mono text-[10.5px] text-text-secondary">{name}</span>
      <span className="font-mono text-[10px] text-text-muted">{tone}</span>
      {copied && (
        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/90 text-primary-foreground">
          <Check className="size-5" />
        </span>
      )}
    </button>
  );
}

const USAGE = `import { ThemaIcon } from "@/icons";

<ThemaIcon name="survey" />                       // 24px, color heredado
<ThemaIcon name="warning" size="sm" tone="warning" />
<ThemaIcon name="success" label="Completado" decorative={false} />

// Fuera del registro, Hugeicons directo (stroke rounded, 1.5):
import { HugeiconsIcon } from "@hugeicons/react";
import { RocketIcon } from "@hugeicons/core-free-icons";
<Button><HugeiconsIcon icon={RocketIcon} strokeWidth={1.5} /> Lanzar</Button>
// …y si el icono se repite, añádelo al registro y a IconName.`;

const REGISTRY_NOTE = `// src/icons/iconRegistry.ts — el único archivo que importa el proveedor.
import { DashboardSquare01Icon, TaskDaily01Icon } from "@hugeicons/core-free-icons";

export const iconRegistry: Record<IconName, IconData> = {
  dashboard: DashboardSquare01Icon,
  survey: TaskDaily01Icon,
  // Cambiar de set solo toca los imports de aquí; IconName no cambia.
};`;

const GLASS_USAGE = `import { GlassIcon } from "@/icons";

// Atajo del inicio: ilustración + título + descripción
<a href="/encuestas" className="flex items-center gap-4">
  <GlassIcon name="survey" tone="violet" />
  <span>
    <strong>Encuestas</strong>
    <p>Mide el clima de tu equipo.</p>
  </span>
</a>

// Estado vacío: tamaño grande, tono de marca
<GlassIcon name="users" tone="brand" size={96} />

// Indicador con significado propio (sin texto al lado): dale label
<GlassIcon name="success" tone="green" size={48} label="Publicada" />`;

export function IconsPage() {
  const [query, setQuery] = React.useState("");
  const [glassSize, setGlassSize] = React.useState<GlassSize>(64);
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? ICON_NAMES.filter((name) => name.toLowerCase().includes(normalized)) : ICON_NAMES;

  return (
    <div className="cascade-enter space-y-12">
      <PageIntro
        eyebrow="Fundamentos"
        title="Iconos"
        description={
          <>
            Dos familias con un mismo registro semántico. <strong className="font-semibold text-text-primary">Hugeicons</strong> (stroke rounded,
            trazo 1.5) para la interfaz: botones, menús, campos y estados; los componentes piden <code>survey</code> o <code>warning</code>, no un
            glifo concreto. <strong className="font-semibold text-text-primary">Glass</strong> para ilustrar atajos, indicadores y estados vacíos
            a 48/64/96 px, siempre con texto al lado.
          </>
        }
      >
        <label className="relative block max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar entre ${ICON_NAMES.length} iconos…`}
            className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-[13px] text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
      </PageIntro>

      <DocSection id="registry" title="Registro" description="Iconos de interfaz (Hugeicons). Haz clic en uno para copiar su uso.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {filtered.map((name) => (
            <IconTile key={name} name={name} />
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-text-muted">Ningún icono coincide con “{query}”.</p>}
      </DocSection>

      <DocSection id="sizes" title="Tamaños" description="Cinco tallas: xs 14px · sm 16px · md 24px · lg 32px · xl 40px. Regla: dentro de botones, campos y menús el icono hereda (sin size); si hay que fijarlo, xs o sm. md para tiles y cabeceras; lg y xl solo en vacíos y portadas. Un concepto, un icono: el registro decide el glifo, la pantalla no.">
        <div className="flex flex-wrap items-end gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <ThemaIcon name="sparkles" size={size} />
              <span className="font-mono text-[11px] text-text-muted">{size}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="tones" title="Tonos" description="Los tonos apuntan a los tokens semánticos, así siguen al tema y al modo.">
        <div className="flex flex-wrap items-end gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card">
          {TONES.map((tone) => (
            <div key={tone} className="flex flex-col items-center gap-2">
              <ThemaIcon name="info" size="lg" tone={tone} />
              <span className="font-mono text-[11px] text-text-muted">{tone}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="glass"
        title="Glass"
        description={
          <>
            Ilustraciones pequeñas generadas en SVG: dos capas de cristal con gradiente, brillo superior y el glifo del registro en blanco. Ocho
            tonos (<code>brand</code> sigue al gradiente de marca del tema) y tres tamaños. No sustituyen a los iconos de interfaz: van junto a un
            título o descripción, nunca solas en un botón.
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-text-secondary">Tamaño</span>
          <div role="radiogroup" aria-label="Tamaño de las ilustraciones" className="inline-flex rounded-lg border border-border/60 bg-surface p-0.5 shadow-card">
            {GLASS_SIZES.map((size) => {
              const isActive = size === glassSize;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setGlassSize(size)}
                  className={cn(
                    "rounded-md px-3 py-1 font-mono text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive ? "bg-primary text-primary-foreground" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
        <div
          className={cn(
            "grid gap-2",
            glassSize === 96 ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-8"
          )}
        >
          {filtered.map((name, index) => (
            <GlassTile key={name} name={name} tone={GLASS_TONES[index % GLASS_TONES.length]} size={glassSize} />
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-text-muted">Ningún icono coincide con “{query}”.</p>}
        <CodeBlock code={GLASS_USAGE} />
      </DocSection>

      <DocSection
        id="usage"
        title="Uso"
        description={
          <>
            Migración: el código nuevo usa <code>ThemaIcon</code> (Hugeicons) o <code>GlassIcon</code>. Los imports directos de{" "}
            <code>lucide-react</code> que quedan en componentes heredados se migran progresivamente; no añadas más.
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock code={USAGE} />
          <CodeBlock code={REGISTRY_NOTE} />
        </div>
      </DocSection>
    </div>
  );
}
