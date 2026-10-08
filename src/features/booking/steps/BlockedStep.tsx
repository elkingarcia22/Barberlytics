import { useAppT } from "@/app/i18n";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { useBookingFlow } from "../flow/BookingContext";
import { StepLayout } from "../flow/StepLayout";

/** El número está bloqueado por la barbería: no se explica por qué, se ofrece el teléfono. */
export function BlockedStep() {
  const t = useAppT();
  const { shop, dispatch } = useBookingFlow();
  return (
    <StepLayout title={t("booking.phone.title")}>
      <EmptyState
        icon="lock"
        iconTone="amber"
        title={t("booking.blocked.title")}
        description={t("booking.blocked.lead")}
        action={
          <div className="flex flex-col items-center gap-2">
            <Button asChild>
              <a href={`tel:${shop.phone}`}>
                <ThemaIcon name="phone" />
                {t("booking.blocked.call", { phone: shop.phone })}
              </a>
            </Button>
            <Button type="button" variant="ghost" onClick={() => dispatch({ type: "restart" })}>
              {t("booking.blocked.other")}
            </Button>
          </div>
        }
      />
    </StepLayout>
  );
}
