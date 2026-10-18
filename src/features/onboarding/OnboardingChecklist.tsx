import * as React from "react";
import { useNavigate } from "react-router";
import { ChevronRight, CircleCheck, Circle } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/typography";
import { InfoCard } from "@/features/team/teamShared";
import { readHidden, STEP_KEYS, useOnboarding, writeHidden } from "./onboarding";

/**
 * Lo que le falta a la barbería para operar, en orden y con un toque a cada pantalla. Cada paso se
 * marca solo cuando el dato existe. Se esconde cuando todo está listo (o si el dueño lo oculta).
 */
export function OnboardingChecklist({ branchId }: { branchId: string }) {
  const t = useAppT();
  const navigate = useNavigate();
  const [hidden, setHidden] = React.useState(readHidden);
  const query = useOnboarding(branchId, !hidden);
  const data = query.data;
  if (hidden || !data || data.done === data.total) return null;

  return (
    <InfoCard
      title={t("onboarding.title")}
      description={t("onboarding.progress", { done: data.done, total: data.total })}
      actions={
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            writeHidden();
            setHidden(true);
          }}
        >
          {t("onboarding.hide")}
        </Button>
      }
      className="mb-section"
    >
      <div data-testid="onboarding-checklist">
        <Progress value={(data.done / data.total) * 100} aria-label={t("onboarding.progress", { done: data.done, total: data.total })} />
        <ol className="mt-4 divide-y divide-border/60">
          {data.steps.map((step) => (
            <li key={step.id}>
              <button type="button" onClick={() => navigate(step.href)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" data-testid={`onboarding-step-${step.id}`}>
                {step.done ? <CircleCheck className="size-4 shrink-0 text-status-positive" aria-hidden /> : <Circle className="size-4 shrink-0 text-text-muted" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <Text weight="semibold" className={cn(step.done && "text-text-muted line-through")}>
                    {t(STEP_KEYS[step.id].title)}
                  </Text>
                  {!step.done && <Text variant="muted">{t(STEP_KEYS[step.id].hint)}</Text>}
                </span>
                <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </InfoCard>
  );
}
