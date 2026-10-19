import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { PopoverDescription, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import type { AppointmentModel } from "./useAppointmentModel";

/**
 * Confirmar que se cancela la cita o que no asistió, en un popover junto al
 * botón que lo pidió: un modal encima del panel lateral queda mal. Al
 * confirmar se corre la acción; el panel pasa a la vista de la cita cerrada.
 */

export type ClosingAction = "noShow" | "cancel";

export function StatusConfirmContent({ model, action, onClose }: { model: AppointmentModel; action: ClosingAction; onClose: () => void }) {
  const t = useAppT();
  const cancel = action === "cancel";
  return (
    <div className="flex flex-col gap-3" data-testid="panel-confirm">
      <PopoverHeader>
        <PopoverTitle>{t(cancel ? "calendar.cancel.title" : "calendar.noShow.title", { name: model.clientName })}</PopoverTitle>
        <PopoverDescription>{t(cancel ? "calendar.cancel.hint" : "calendar.noShow.hint")}</PopoverDescription>
      </PopoverHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("calendar.cancel.keep")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            model.run(action);
            onClose();
          }}
          data-testid="panel-confirm-yes"
        >
          {t(cancel ? "calendar.cancel.confirm" : "calendar.noShow.confirm")}
        </Button>
      </div>
    </div>
  );
}
