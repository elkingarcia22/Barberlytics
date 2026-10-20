import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Ticket, X } from "lucide-react";
import { describeError } from "@/lib/api";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTile } from "@/components/utility/IconTile";
import { couponsApi } from "@/features/marketing/coupons";
import type { ModelContext } from "../calendarModel";
import type { CheckoutController } from "./useCheckout";

/**
 * Canjear un cupón de la barbería en la caja: se escribe el código, el servidor dice si vale para este cliente y estos
 * servicios (fechas, topes, primera visita) y, aplicado, reemplaza al descuento a mano. El uso se anota al cobrar.
 */
export function CouponField({ checkout, ctx }: { checkout: CheckoutController; ctx: ModelContext }) {
  const { t } = checkout;
  const [code, setCode] = React.useState("");
  const check = useMutation({ mutationFn: () => couponsApi.check({ ...checkout.couponScope, code }) });

  if (checkout.coupon) {
    return (
      <section className="flex items-center gap-3 rounded-xl border border-input bg-surface p-3" data-testid="checkout-coupon-applied">
        <IconTile size="md" shape="circle" tone="positive" icon={<Ticket />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text weight="medium">{t("calendar.checkout.coupon.applied", { code: checkout.coupon.code })}</Text>
          <Text size="xs" tone="muted" tabular>
            {t("calendar.checkout.discount.amount", { amount: ctx.formatMoney(checkout.discount) })}
          </Text>
        </span>
        <Button size="icon-xs" variant="ghost" aria-label={t("calendar.checkout.coupon.remove")} onClick={() => checkout.setCoupon(null)}>
          <X />
        </Button>
      </section>
    );
  }

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    check.mutate(undefined, {
      onSuccess: (coupon) => {
        // El cupón manda: el descuento a mano se quita para no sumar dos.
        checkout.setDiscountValue(null);
        checkout.setCoupon(coupon);
        checkout.setCouponOpen(false);
      },
    });
  };

  return (
    <form onSubmit={apply} className="flex flex-col gap-2 rounded-xl border border-input bg-surface p-3" data-testid="checkout-coupon">
      <div className="flex items-center gap-2">
        <IconTile size="md" shape="circle" tone="neutral" icon={<Ticket />} />
        <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder={t("calendar.checkout.coupon.placeholder")} aria-label={t("calendar.checkout.coupon.title")} autoFocus autoComplete="off" className="flex-1 uppercase" data-testid="checkout-coupon-code" />
        <Button type="submit" size="sm" disabled={!code.trim() || check.isPending} data-testid="checkout-coupon-apply">
          {t("calendar.checkout.coupon.apply")}
        </Button>
        <Button type="button" size="icon-xs" variant="ghost" aria-label={t("calendar.checkout.coupon.remove")} onClick={() => checkout.setCouponOpen(false)}>
          <X />
        </Button>
      </div>
      {check.isError && (
        <Text size="sm" tone="negative" role="alert">
          {describeError(check.error).description}
        </Text>
      )}
    </form>
  );
}
