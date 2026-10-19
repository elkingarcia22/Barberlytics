import { Sparkles } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { useNarrative, type Facts } from "./narrative";

export interface NarrativeCardProps {
  title: string;
  kind: "week" | "pay";
  facts: Facts | null;
  /** El resumen automático: lo mismo, escrito con plantilla. */
  fallback: string;
  className?: string;
  "data-testid"?: string;
}

/**
 * Un resumen en palabras de unas cifras, con las cifras a la vista para comprobarlo. Dice si lo
 * redactó la IA o si es el resumen automático: prometer IA donde no la hay quita confianza.
 */
export function NarrativeCard({ title, kind, facts, fallback, className, "data-testid": testId }: NarrativeCardProps) {
  const t = useAppT();
  const { locale } = useLocale();
  const query = useNarrative(kind, locale === "en" ? "en" : "es", facts, fallback);

  return (
    <InfoCard title={title} className={className}>
      <div className="space-y-3" data-testid={testId}>
        {query.isPending || !query.data ? <Skeleton className="h-16 w-full" /> : <p className="text-sm leading-relaxed text-text-primary">{query.data.text}</p>}
        {query.data && (
          <p className="flex items-center gap-1.5 text-xs text-text-muted" data-testid={testId ? `${testId}-source` : undefined}>
            {query.data.source === "ai" && <Sparkles className="size-3.5" aria-hidden />}
            {query.data.source === "ai" ? t("narrative.sourceAi") : t("narrative.sourceAuto")}
          </p>
        )}
        {facts && (
          <details className="text-xs text-text-muted">
            <summary className="cursor-pointer select-none">{t("narrative.seeFacts")}</summary>
            <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {Object.entries(facts).map(([key, fact]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt>{fact.label}</dt>
                  <dd className="tabular-nums text-text-secondary">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <Text variant="muted" className="sr-only">
          {t("narrative.disclaimer")}
        </Text>
      </div>
    </InfoCard>
  );
}
