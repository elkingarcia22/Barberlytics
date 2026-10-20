import * as React from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { describeError, isApiError } from "@/lib/api";
import { Field, NumberField } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoCard } from "../teamShared";
import type { Level } from "../types";
import { CHECK_KEYS, EMPTY_CRITERIA as EMPTY } from "./levelSummary";
import { useLevelActions, useLevelProgress, type LevelCriteria, type LevelProgress } from "./operationsApi";


/** Las reglas de un nivel: su factor de precio y lo que hace falta para llegar. */
export function LevelRulesDialog({ level, onClose }: { level: Level | null; onClose: () => void }) {
  const t = useAppT();
  const { rules } = useLevelActions();
  const [factor, setFactor] = React.useState<number | null>(level?.priceFactor ?? 1);
  const [criteria, setCriteria] = React.useState<LevelCriteria>(level?.criteria ?? EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const set = (key: keyof LevelCriteria, value: number | null) => setCriteria((current) => ({ ...current, [key]: value }));
  const save = () => {
    if (!level) return;
    setErrors({});
    rules.mutate(
      { id: level.id, priceFactor: factor ?? 1, criteria },
      {
        onSuccess: () => {
          toast.success(t("teamLevels.rules.saved"));
          onClose();
        },
        onError: (error) => {
          const fields = isApiError(error) ? error.fieldErrors : undefined;
          if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages[0] ?? ""])));
          else toast.error(describeError(error).description);
        },
      }
    );
  };
  return (
    <ModalShell
      open={level !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t("teamLevels.rules.title", { name: level?.name ?? "" })}
      description={t("teamLevels.rules.hint")}
      size="md"
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={rules.isPending} data-testid="level-rules-save">
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2" data-testid="level-rules">
        <Field label={t("teamLevels.rules.factorLabel")} description={t("teamLevels.rules.factorHint")} error={errors.priceFactor}>
          <NumberField value={factor} onValueChange={setFactor} min={0.5} max={3} precision={2} step={0.05} prefix="×" />
        </Field>
        <Field label={t("teamLevels.rules.services90")} error={errors.services90}>
          <NumberField value={criteria.services90} onValueChange={(value) => set("services90", value)} min={0} precision={0} />
        </Field>
        <Field label={t("teamLevels.rules.rebookRate")} error={errors.rebookRate}>
          <NumberField value={criteria.rebookRate} onValueChange={(value) => set("rebookRate", value)} min={0} max={100} precision={0} suffix="%" />
        </Field>
        <Field label={t("teamLevels.rules.rating")} error={errors.rating}>
          <NumberField value={criteria.rating} onValueChange={(value) => set("rating", value)} min={0} max={5} precision={1} step={0.1} suffix="★" />
        </Field>
        <Field label={t("teamLevels.rules.months")} error={errors.months}>
          <NumberField value={criteria.months} onValueChange={(value) => set("months", value)} min={0} precision={0} />
        </Field>
      </div>
    </ModalShell>
  );
}

/** Cada requisito del siguiente nivel con lo que lleva: ✓ o lo que le falta. */
export function LevelChecks({ progress }: { progress: LevelProgress }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  return (
    <div className="flex flex-wrap gap-1.5">
      {progress.checks.map((check) => (
        <Badge key={check.id} variant={check.met ? "positive" : "neutral"}>
          {check.met ? <Check className="size-3" /> : <X className="size-3" />}
          {t(CHECK_KEYS[check.id], { value: formatNumber(check.need) })}
          {!check.met && check.have !== null && <span className="opacity-70"> · {t("teamLevels.criteria.have", { value: formatNumber(check.have) })}</span>}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Quién está listo para subir de nivel (cumple todo lo del siguiente) y cómo va cada uno. Ascender puede ajustar sus
 * precios al factor del nuevo nivel.
 */
export function LevelReadiness({ branchId }: { branchId: string }) {
  const t = useAppT();
  const query = useLevelProgress(branchId);
  const [promoting, setPromoting] = React.useState<LevelProgress | null>(null);
  const items = (query.data?.items ?? []).filter((item) => item.next !== null);
  if (items.length === 0) return null;
  const ready = items.filter((item) => item.ready);
  return (
    <InfoCard title={t("teamLevels.readiness.title")} description={ready.length > 0 ? t("teamLevels.readiness.ready", { count: ready.length }) : t("teamLevels.readiness.none")}>
      <ul className="divide-y divide-border/60" data-testid="level-readiness">
        {[...ready, ...items.filter((item) => !item.ready)].map((item) => (
          <li key={item.memberId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-medium text-text-primary">
                {item.name} <span className="font-normal text-text-muted">· {t("teamLevels.readiness.path", { from: item.level?.name ?? "—", to: item.next?.name ?? "" })}</span>
              </p>
              <LevelChecks progress={item} />
            </div>
            {item.ready && (
              <Button size="sm" onClick={() => setPromoting(item)} data-testid="level-promote">
                <ArrowUpRight /> {t("teamLevels.readiness.promote", { level: item.next?.name ?? "" })}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <PromoteDialog progress={promoting} onClose={() => setPromoting(null)} />
    </InfoCard>
  );
}

function PromoteDialog({ progress, onClose }: { progress: LevelProgress | null; onClose: () => void }) {
  const t = useAppT();
  const { formatNumber } = useLocale();
  const { promote } = useLevelActions();
  const [reprice, setReprice] = React.useState(true);
  const next = progress?.next;
  const confirm = () => {
    if (!progress || !next) return;
    promote.mutate(
      { memberId: progress.memberId, levelId: next.id, reprice },
      {
        onSuccess: () => {
          toast.success(t("teamLevels.readiness.promoted", { name: progress.name, level: next.name }));
          onClose();
        },
        onError: (error) => toast.error(describeError(error).description),
      }
    );
  };
  return (
    <ModalShell
      open={progress !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t("teamLevels.readiness.promoteTitle", { name: progress?.name ?? "", level: next?.name ?? "" })}
      size="sm"
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={confirm} disabled={promote.isPending} data-testid="level-promote-confirm">
            {t("teamLevels.readiness.promoteConfirm")}
          </Button>
        </>
      }
    >
      <label className="flex items-start gap-3 text-sm">
        <Checkbox checked={reprice} onCheckedChange={(checked) => setReprice(checked === true)} className="mt-0.5" />
        <span>
          <span className="font-medium text-text-primary">{t("teamLevels.readiness.reprice", { factor: formatNumber(next?.priceFactor ?? 1, { maximumFractionDigits: 2 }) })}</span>
          <Text size="xs" tone="muted">
            {t("teamLevels.readiness.repriceHint")}
          </Text>
        </span>
      </label>
    </ModalShell>
  );
}
