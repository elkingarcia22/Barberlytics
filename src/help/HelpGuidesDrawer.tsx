import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, Clock, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { IconTile } from "@/components/utility";
import { Text } from "@/components/typography";
import { useAppT } from "@/app/i18n";
import { useLocalizer } from "@/i18n";
import { helpPath } from "./content";
import { HELP_GUIDES, type HelpGuide } from "./guides";

export interface HelpGuidesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Lo marcado se recuerda en este navegador: es una comodidad de cada persona, no un dato compartido. */
const STORAGE_KEY = "barberlytics-help-guides";
type GuideProgress = Readonly<Record<string, readonly number[]>>;

function readProgress(): GuideProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuideProgress) : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: GuideProgress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Sin almacenamiento (ventana privada, bloqueado): se marca igual, solo que no se recuerda.
  }
}

function GuideCard({ guide, done, onOpen }: { guide: HelpGuide; done: number; onOpen: () => void }) {
  const t = useAppT();
  const localize = useLocalizer();
  const Icon = guide.icon;
  const total = guide.steps.length;
  const complete = done === total;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-surface p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      data-testid={`help-guide-${guide.id}`}
    >
      <IconTile size="sm" tone={complete ? "positive" : "neutral"} icon={complete ? <Check /> : <Icon />} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <Text size="sm" weight="medium" className="leading-snug">
          {localize(guide.title)}
        </Text>
        <Text size="xs" tone="muted" className="line-clamp-2">
          {localize(guide.description)}
        </Text>
        <span className="flex items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {t("help.guideMinutes", { count: guide.minutes })}
          </span>
          <span>{complete ? t("help.guideDone") : t("help.guideProgress", { done, total })}</span>
        </span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-text-muted transition-colors group-hover:text-primary" />
    </button>
  );
}

function GuideSteps({
  guide,
  done,
  onToggle,
  onReset,
}: {
  guide: HelpGuide;
  done: readonly number[];
  onToggle: (index: number) => void;
  onReset: () => void;
}) {
  const t = useAppT();
  const localize = useLocalizer();
  const total = guide.steps.length;
  // El paso que toca es el primero sin marcar: se destaca para que se vea por dónde vas.
  const current = guide.steps.findIndex((_, index) => !done.includes(index));
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Text size="xs" weight="semibold" tone="secondary" className="uppercase tracking-wide">
            {current === -1 ? t("help.guideDone") : t("help.guideProgress", { done: done.length, total })}
          </Text>
          {done.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="size-3.5" />
              {t("help.guideReset")}
            </Button>
          )}
        </div>
        <Progress value={(done.length / total) * 100} />
      </div>

      <ol className="flex flex-col gap-2">
        {guide.steps.map((step, index) => {
          const checked = done.includes(index);
          const id = `guide-${guide.id}-${index}`;
          return (
            <li
              key={index}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                index === current ? "border-primary/50 bg-primary/5" : "border-border/60 bg-surface",
                checked && "opacity-70"
              )}
            >
              <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(index)} className="mt-0.5" />
              <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
                <span className={cn("text-sm font-medium text-text-primary", checked && "line-through decoration-text-muted")}>
                  <span className="mr-1.5 text-text-muted">{index + 1}.</span>
                  {localize(step.title)}
                </span>
                {step.detail && <span className="text-xs leading-snug text-text-muted">{localize(step.detail)}</span>}
              </label>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * «Guíame paso a paso»: tareas del día partidas en pasos que se marcan.
 *
 * Es la semilla de las experiencias guiadas. Hoy la persona sigue la lista con
 * la app al lado y marca lo que va haciendo; con el rediseño cada paso podrá
 * señalar su botón dentro de la pantalla. Cada guía enlaza a su artículo, con
 * las capturas, por si hace falta más detalle.
 */
export function HelpGuidesDrawer({ open, onOpenChange }: HelpGuidesDrawerProps) {
  const t = useAppT();
  const localize = useLocalizer();
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<GuideProgress>(readProgress);
  const active = HELP_GUIDES.find((guide) => guide.id === activeId) ?? null;

  const update = (guideId: string, next: readonly number[]) => {
    setProgress((previous) => {
      const merged = { ...previous, [guideId]: next };
      writeProgress(merged);
      return merged;
    });
  };

  const toggle = (guide: HelpGuide, index: number) => {
    const current = progress[guide.id] ?? [];
    update(guide.id, current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveId(null);
    onOpenChange(next);
  };

  return (
    <DrawerShell
      open={open}
      onOpenChange={handleOpenChange}
      size="md"
      title={active ? localize(active.title) : t("help.guidesTitle")}
      description={active ? localize(active.description) : t("help.guidesDescription")}
      footer={
        active ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setActiveId(null)}>
              <ArrowLeft className="size-4" />
              {t("help.guideBack")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                navigate(helpPath(active.articleId));
              }}
            >
              {t("help.guideOpenArticle")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : undefined
      }
    >
      <div data-testid="help-guides" className="flex flex-col gap-4">
        {active ? (
          <GuideSteps guide={active} done={progress[active.id] ?? []} onToggle={(index) => toggle(active, index)} onReset={() => update(active.id, [])} />
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface-muted/60 p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <Text size="xs" tone="secondary" className="leading-snug">
                {t("help.guidesSoon")}
              </Text>
            </div>
            <div className="flex flex-col gap-3">
              {HELP_GUIDES.map((guide) => (
                <GuideCard key={guide.id} guide={guide} done={(progress[guide.id] ?? []).length} onOpen={() => setActiveId(guide.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </DrawerShell>
  );
}
