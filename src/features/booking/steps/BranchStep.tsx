import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { MagicCard } from "@/components/ui/magic-card";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { useBookingFlow } from "../flow/BookingContext";
import { StepLayout } from "../flow/StepLayout";

/**
 * La sede, con foto: se reconoce el local antes que la dirección. Tocar la
 * tarjeta elige y avanza; no hay «Siguiente» para una sola decisión.
 */
export function BranchStep() {
  const t = useAppT();
  const { shop, state, dispatch, fmt, layout } = useBookingFlow();
  return (
    <StepLayout title={t("booking.branch.title")} lead={t("booking.branch.lead")}>
      {state.items.length > 0 && (
        <Text size="sm" tone="warning" className="flex items-center gap-2">
          <ThemaIcon name="warning" size="sm" tone="warning" />
          {t("booking.branch.changeWarning")}
        </Text>
      )}
      <div role="radiogroup" aria-label={t("booking.branch.title")} className={cn("grid grid-cols-1 gap-3", layout === "wide" && "sm:grid-cols-2")}>
        {shop.branches.map((branch) => (
          <MagicCard
            key={branch.id}
            role="radio"
            aria-checked={branch.id === state.branchId}
            aria-label={`${branch.name}, ${branch.address}`}
            isSelected={branch.id === state.branchId}
            onClick={() => dispatch({ type: "chooseBranch", branchId: branch.id })}
            contentClassName="items-center gap-4 text-left"
          >
            <IconTile size="xl" src={branch.imageUrl} icon={<ThemaIcon name="building" />} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <Text weight="semibold" truncate>
                {branch.name}
              </Text>
              <Text size="xs" tone="secondary" className="flex items-center gap-1.5">
                <ThemaIcon name="compass" size="xs" />
                <span className="truncate">
                  {branch.address}, {branch.city}
                </span>
              </Text>
              <Text size="xs" tone="secondary" className="flex items-center gap-1.5">
                <ThemaIcon name="clock" size="xs" />
                {t("booking.branch.hours", { from: fmt.clock(branch.opensAt), to: fmt.clock(branch.closesAt) })}
              </Text>
              <Text size="xs" tone="muted" className="flex items-center gap-1.5">
                <ThemaIcon name="users" size="xs" />
                {t("booking.branch.barbers", { count: branch.barbers })}
              </Text>
            </span>
            <ThemaIcon name="chevronRight" size="sm" tone="muted" />
          </MagicCard>
        ))}
      </div>
    </StepLayout>
  );
}
