import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookingFlow } from "../../flow/BookingContext";
import { BookingSheet } from "../../flow/BookingSheet";

/**
 * La sede de la agenda, a la vista junto al título: las horas que se ven son de
 * esta sede. Cambiarla con citas apartadas vacía la reserva (barberos y precios
 * son de cada sede), así que antes se pregunta.
 */
export function AgendaBranchSelect() {
  const t = useAppT();
  const { shop, state, dispatch } = useBookingFlow();
  const [pending, setPending] = React.useState<string | null>(null);
  if (shop.branches.length < 2 || !state.branchId) return null;

  const change = (branchId: string) => {
    if (branchId === state.branchId) return;
    if (state.items.length > 0) setPending(branchId);
    else dispatch({ type: "chooseBranch", branchId });
  };

  return (
    <div className="flex items-center gap-2">
      <Text size="sm" tone="muted" as="span">
        {t("booking.agenda.branchLabel")}
      </Text>
      <Select value={state.branchId} onValueChange={change}>
        <SelectTrigger size="sm" aria-label={t("booking.agenda.branchLabel")} className="min-w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {shop.branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <BookingSheet
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={t("booking.agenda.branchChangeTitle")}
        description={t("booking.agenda.branchChangeBody")}
        actions={
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                if (pending) dispatch({ type: "chooseBranch", branchId: pending });
                setPending(null);
              }}
            >
              {t("booking.agenda.branchChangeOk")}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => setPending(null)}>
              {t("booking.agenda.branchChangeCancel")}
            </Button>
          </div>
        }
      >
        <Text tone="secondary">{t("booking.agenda.branchChangeCount", { count: state.items.length })}</Text>
      </BookingSheet>
    </div>
  );
}
