import * as React from "react";
import { useAppT } from "@/app/i18n";
import { OptionTile } from "@/components/selection";
import { Text } from "@/components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "./BookingContext";
import { BookingSheet } from "./BookingSheet";

/**
 * La sede de la reserva, en el resumen: dónde será y un botón para cambiarla.
 * Quien ya es cliente no elige sede al empezar —se da por hecha la de siempre—,
 * así que aquí es donde la ajusta antes de pagar. Cambiarla pide volver a elegir
 * las citas, porque los barberos, los precios y las horas son de cada sede.
 */
export function BranchChange() {
  const t = useAppT();
  const { shop, state, dispatch } = useBookingFlow();
  const [isOpen, setIsOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<string | null>(null);
  const current = shop.branches.find((branch) => branch.id === state.branchId);
  if (!current) return null;
  const canChange = shop.branches.length > 1;
  const target = picked ?? current.id;

  const open = (next: boolean) => {
    setIsOpen(next);
    if (next) setPicked(current.id);
  };
  const confirm = () => {
    setIsOpen(false);
    if (target !== current.id) dispatch({ type: "chooseBranch", branchId: target });
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <IconTile size="lg" src={current.imageUrl} icon={<ThemaIcon name="building" />} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Text size="xs" tone="muted">
          {t("booking.card.branch")}
        </Text>
        <Text weight="semibold" truncate>
          {current.name}
        </Text>
        <Text size="xs" tone="secondary" truncate>
          {current.address}, {current.city}
        </Text>
      </div>
      {canChange && (
        <Button type="button" variant="ghost" size="sm" onClick={() => open(true)}>
          <ThemaIcon name="edit" />
          {t("booking.review.edit")}
        </Button>
      )}

      <BookingSheet
        open={isOpen}
        onOpenChange={open}
        title={t("booking.branch.changeTitle")}
        description={t("booking.branch.lead")}
        actions={
          <>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              {t("booking.cancel.keep")}
            </Button>
            <Button type="button" onClick={confirm} disabled={target === current.id}>
              {t("booking.branch.changeConfirm")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label={t("booking.branch.title")} className="flex flex-col gap-2">
            {shop.branches.map((branch) => (
              <OptionTile
                key={branch.id}
                option={{ value: branch.id, label: branch.name, description: `${branch.address}, ${branch.city}`, badge: branch.id === current.id ? t("booking.branch.current") : undefined }}
                selected={target === branch.id}
                onSelect={setPicked}
              />
            ))}
          </div>
          {target !== current.id && state.items.length > 0 && (
            <Alert variant="warning">
              <ThemaIcon name="warning" />
              <AlertDescription>{t("booking.branch.changeWarning")}</AlertDescription>
            </Alert>
          )}
        </div>
      </BookingSheet>
    </div>
  );
}
