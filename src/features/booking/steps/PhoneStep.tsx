import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field, PhoneInput } from "@/components/forms";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { ThemaIcon } from "@/icons";
import type { IconName } from "@/icons";
import { describeError } from "@/lib/api";
import { useBookingFlow } from "../flow/BookingContext";
import { ShopBrand } from "../flow/ShopBrand";
import { StepLayout } from "../flow/StepLayout";
import { formatPhone } from "../bookingFormat";
import { useLookupMutation } from "../queries";

/** Dígitos mínimos de un celular nacional (Colombia y EE. UU. tienen 10). */
const MIN_DIGITS = 10;
const nationalDigits = (e164: string): number => e164.replace(/\D/g, "").length - 2;

const TRUST: readonly { icon: IconName; key: "booking.phone.trust.secure" | "booking.phone.trust.fast" | "booking.phone.trust.instant" }[] = [
  { icon: "securityLock", key: "booking.phone.trust.secure" },
  { icon: "clock", key: "booking.phone.trust.fast" },
  { icon: "success", key: "booking.phone.trust.instant" },
];

/**
 * La puerta: el celular. Con él se sabe si es alguien que vuelve (y se le
 * ahorra todo), alguien nuevo (se le pide nombre y correo) o un número que la
 * barbería bloqueó.
 */
export function PhoneStep() {
  const t = useAppT();
  const { state, dispatch, shop, fmt } = useBookingFlow();
  const lookup = useLookupMutation();
  const [phone, setPhone] = React.useState(state.phone);
  const [touched, setTouched] = React.useState(false);
  const isValid = nationalDigits(phone) >= MIN_DIGITS;
  // Con varias sedes, desde que abre la primera hasta que cierra la última.
  const opensAt = shop.branches.map((branch) => branch.opensAt).sort()[0] ?? "09:00";
  const closesAt = shop.branches.map((branch) => branch.closesAt).sort().at(-1) ?? "19:00";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    dispatch({ type: "phoneEntered", phone });
    lookup.mutate(phone, {
      onSuccess: (result) => {
        if (result.status === "known") dispatch({ type: "customerFound", customer: result.customer });
        else if (result.status === "blocked") dispatch({ type: "customerBlocked" });
        else dispatch({ type: "customerIsNew" });
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="contents">
      <StepLayout
        title={t("booking.phone.title")}
        lead={t("booking.phone.lead")}
        footer={
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" className="w-full" disabled={lookup.isPending}>
              {lookup.isPending ? <Spinner size="sm" tone="inverse" /> : null}
              {t("booking.phone.continue")}
              {!lookup.isPending && <ThemaIcon name="arrowRight" />}
            </Button>
            <Text size="xs" tone="muted" className="text-center">
              {t("booking.phone.consent")}
            </Text>
          </div>
        }
      >
        <Field
          label={t("booking.phone.label")}
          description={t("booking.phone.hint")}
          error={touched && !isValid ? t("booking.phone.invalid") : lookup.isError ? describeError(lookup.error).description : undefined}
        >
          <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="CO" autoFocus autoComplete="tel-national" />
        </Field>

        <ul className="grid grid-cols-3 gap-2">
          {TRUST.map((item) => (
            <li key={item.key} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-subtle px-2 py-3 text-center">
              <ThemaIcon name={item.icon} size="sm" tone="primary" />
              <Text size="xs" tone="secondary">
                {t(item.key)}
              </Text>
            </li>
          ))}
        </ul>

        {/* La barbería: quién es, cuántas sedes, cuándo abre hoy y a dónde llamar. */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <ShopBrand shop={shop} iconOnly />
            <div className="flex min-w-0 flex-1 flex-col">
              <Text weight="semibold" truncate>
                {shop.name}
              </Text>
              <Text size="xs" tone="muted">
                {t("booking.phone.branches", { count: shop.branches.length })}
              </Text>
            </div>
          </div>
          <dl className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2.5">
              <ThemaIcon name="clock" size="sm" tone="muted" />
              <Text size="sm" tone="secondary" as="dd">
                {t("booking.phone.openToday", { from: fmt.clock(opensAt), to: fmt.clock(closesAt) })}
              </Text>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemaIcon name="phone" size="sm" tone="muted" />
              <Text size="sm" as="dd">
                <a href={`tel:${shop.phone}`} className="font-medium text-text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  {formatPhone(shop.phone)}
                </a>
              </Text>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-center gap-1">
          <Text size="sm" tone="muted" as="span">
            {t("booking.phone.haveAppointment")}
          </Text>
          <Button type="button" variant="link" size="sm" onClick={() => dispatch({ type: "openManage" })}>
            {t("booking.phone.manage")}
          </Button>
        </div>
      </StepLayout>
    </form>
  );
}
