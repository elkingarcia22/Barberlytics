import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "../../flow/BookingContext";
import { PickerField, PickerOverlay, PickerRow } from "./AgendaPicker";

/**
 * La sede en la Agenda con selector: el mismo campo que los servicios (foto del
 * local, nombre y dirección) y la lista de sedes en la misma ventana. Tocar una
 * sede la elige y cierra. Con citas ya apartadas cambiar vacía la reserva
 * (barberos y precios son de cada sede): la sede queda marcada y el pie pide
 * confirmarlo antes.
 */
export function AgendaBranchField({ labelledBy }: { labelledBy: string }) {
  const t = useAppT();
  const { shop, state, dispatch, fmt } = useBookingFlow();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const current = shop.branches.find((branch) => branch.id === state.branchId);
  if (shop.branches.length < 2 || !current) return null;

  const openChange = (next: boolean) => {
    setOpen(next);
    if (!next) setPending(null);
  };
  const choose = (branchId: string) => {
    dispatch({ type: "chooseBranch", branchId });
    openChange(false);
  };
  const pick = (branchId: string) => {
    if (branchId === state.branchId) return openChange(false);
    if (state.items.length > 0) return setPending(branchId);
    choose(branchId);
  };
  const marked = pending ?? state.branchId;

  const footer = pending ? (
    <div className="flex w-full flex-col gap-3">
      <Text size="sm" tone="secondary" aria-live="polite">
        {t("booking.agenda.branchChangeBody")} {t("booking.agenda.branchChangeCount", { count: state.items.length })}
      </Text>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" size="lg" onClick={() => setPending(null)}>
          {t("booking.agenda.branchChangeCancel")}
        </Button>
        <Button type="button" size="lg" onClick={() => choose(pending)}>
          {t("booking.agenda.branchChangeOk")}
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <PickerField
        labelledBy={labelledBy}
        imageUrl={current.imageUrl}
        icon="building"
        value={current.name}
        detail={`${current.address}, ${current.city}`}
        placeholder={t("booking.agenda.branchLabel")}
        open={open}
        onOpen={() => setOpen(true)}
        testId="agenda-branch-field"
      />
      <PickerOverlay open={open} onOpenChange={openChange} title={t("booking.branch.title")} description={t("booking.branch.lead")} footer={footer} focusRef={listRef}>
        <div ref={listRef} role="radiogroup" aria-label={t("booking.branch.title")} className="flex flex-col gap-0.5 p-2">
          {shop.branches.map((branch) => (
            <PickerRow key={branch.id} role="radio" checked={branch.id === marked} label={`${branch.name}, ${branch.address}`} imageUrl={branch.imageUrl} icon="building" onClick={() => pick(branch.id)}>
              <Text as="span" weight="medium" className="truncate">
                {branch.name}
              </Text>
              <Text as="span" size="xs" tone="secondary" className="truncate">
                {branch.address}, {branch.city}
              </Text>
              <Text as="span" size="xs" tone="muted" tabular className="flex flex-wrap items-center gap-x-1.5">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <ThemaIcon name="clock" size="xs" />
                  {t("booking.branch.hours", { from: fmt.clock(branch.opensAt), to: fmt.clock(branch.closesAt) })}
                </span>
                <span className="whitespace-nowrap">· {t("booking.branch.barbers", { count: branch.barbers })}</span>
              </Text>
            </PickerRow>
          ))}
        </div>
      </PickerOverlay>
    </>
  );
}
