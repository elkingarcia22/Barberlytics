import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "./BookingContext";

/**
 * El cierre de quien solo se apuntó en la lista de espera: no hay cita que pagar,
 * así que en vez de «Continuar» va «Finalizar», que lleva a su confirmación.
 */
export function WaitlistFinish() {
  const t = useAppT();
  const { dispatch } = useBookingFlow();
  return (
    <div className="flex w-full flex-col gap-2">
      <Text size="xs" tone="muted" className="flex items-center gap-1.5">
        <ThemaIcon name="notification" size="xs" />
        {t("booking.waitlist.finishHint")}
      </Text>
      <Button type="button" size="lg" className="w-full" onClick={() => dispatch({ type: "finishWaitlist" })}>
        {t("booking.waitlist.finish")}
        <ThemaIcon name="arrowRight" />
      </Button>
    </div>
  );
}
