import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { InfoCard } from "../teamShared";
import { LevelChecks } from "./LevelRules";
import { useLevelProgress } from "./operationsApi";

/** Su nivel y lo que le falta para el siguiente, con lo que lleva en 90 días. Sin siguiente nivel, no se muestra. */
export function MyLevelCard({ branchId }: { branchId: string }) {
  const t = useAppT();
  const query = useLevelProgress(branchId);
  const mine = query.data?.items[0];
  if (!mine?.next) return null;
  return (
    <InfoCard title={t("teamLevels.mine.title", { level: mine.level?.name ?? "—" })} description={t(mine.ready ? "teamLevels.mine.ready" : "teamLevels.mine.toNext", { level: mine.next.name })}>
      <div className="space-y-2" data-testid="my-level">
        <LevelChecks progress={mine} />
        <Text size="xs" tone="muted">
          {t("teamLevels.mine.hint")}
        </Text>
      </div>
    </InfoCard>
  );
}
