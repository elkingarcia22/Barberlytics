import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useAppT } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeError } from "@/lib/api";
import { bookingApi } from "../api";
import { useBookingFlow } from "./BookingContext";

/**
 * Usar una tarjeta de regalo: se valida el código en el servidor y su saldo paga primero. Si
 * sobra, queda en la tarjeta para la próxima. Plegada tras un enlace: casi nadie la tiene a mano.
 */
export function GiftCardField() {
  const t = useAppT();
  const { state, dispatch, totals, fmt } = useBookingFlow();
  const [isOpen, setIsOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const check = useMutation({ mutationFn: () => bookingApi.checkGift(code) });

  if (state.gift) {
    const left = Math.max(0, state.gift.balance - totals.gift);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip label={t("booking.gift.applied", { code: state.gift.code.slice(-4) })} tone="positive" icon="ticket" removable onRemove={() => dispatch({ type: "setGift", gift: null })} />
        <Text size="sm" tone="positive" tabular>
          {t("booking.gift.covers", { amount: fmt.money(totals.gift) })}
        </Text>
        {left > 0 && (
          <Text size="xs" tone="muted" tabular className="basis-full">
            {t("booking.gift.left", { amount: fmt.money(left) })}
          </Text>
        )}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="link" size="sm" className="self-start px-0" onClick={() => setIsOpen(true)}>
        {t("booking.gift.have")}
      </Button>
    );
  }

  const apply = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!code.trim()) return;
    check.mutate(undefined, { onSuccess: (gift) => dispatch({ type: "setGift", gift }) });
  };

  return (
    <Field label={t("booking.gift.label")} error={check.isError ? describeError(check.error).description : undefined}>
      <div className="flex gap-2">
        <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="BL-XXXX-XXXX" onKeyDown={(event) => event.key === "Enter" && apply(event)} autoCapitalize="characters" autoFocus />
        <Button type="button" variant="outline" onClick={() => apply()} disabled={!code.trim() || check.isPending}>
          {t("booking.payment.promoApply")}
        </Button>
      </div>
    </Field>
  );
}
