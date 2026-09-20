import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemaIcon, iconRegistry, type IconName, type IconSize, type IconTone } from "@/icons";
import { CodeBlock } from "../components/CodeBlock";
import { useCopy } from "../hooks/useCopy";
import { DocSection, PageIntro } from "../components/PageIntro";

const ICON_NAMES = Object.keys(iconRegistry) as IconName[];
const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
const TONES: IconTone[] = ["default", "muted", "primary", "positive", "negative", "warning", "info"];

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

const USAGE = `import { ThemaIcon } from "@/icons";

<ThemaIcon name="survey" />                       // 24px, color heredado
<ThemaIcon name="warning" size="sm" tone="warning" />
<ThemaIcon name="success" label="Completado" decorative={false} />

// Para iconos fuera del registro, Lucide directo:
import { Sparkles } from "lucide-react";
<Button><Sparkles /> Sugerir</Button>            // el botón ya lo dimensiona a 16px`;

const REGISTRY_NOTE = `// src/icons/iconRegistry.ts — el único archivo que importa el proveedor.
export const iconRegistry: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  survey: ClipboardList,
  // Para migrar a Iconly basta con cambiar los imports aquí.
};`;

export function IconsPage() {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? ICON_NAMES.filter((name) => name.toLowerCase().includes(normalized)) : ICON_NAMES;

  return (
    <div className="cascade-enter space-y-12">
      <PageIntro
        eyebrow="Fundamentos"
        title="Iconos"
        description="Un registro semántico sobre Lucide: los componentes piden 'survey' o 'warning', no un glifo concreto. El trazo se afina a 1.75 en todo el sistema (globals.css) para que los iconos pesen como el texto."
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

      <DocSection id="registry" title="Registro" description="Haz clic en un icono para copiar su uso.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {filtered.map((name) => (
            <IconTile key={name} name={name} />
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-text-muted">Ningún icono coincide con “{query}”.</p>}
      </DocSection>

      <DocSection id="sizes" title="Tamaños" description="Cinco tallas: xs 14px · sm 16px · md 24px · lg 32px · xl 40px.">
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

      <DocSection id="usage" title="Uso">
        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock code={USAGE} />
          <CodeBlock code={REGISTRY_NOTE} />
        </div>
      </DocSection>
    </div>
  );
}
