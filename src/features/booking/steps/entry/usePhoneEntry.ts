import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useBookingFlow } from "../../flow/BookingContext";
import { toastMissing } from "../../flow/missingData";

/** Dígitos mínimos de un celular nacional (Colombia y EE. UU. tienen 10). */
const MIN_DIGITS = 10;
const nationalDigits = (e164: string): number => e164.replace(/\D/g, "").length - 2;

/**
 * Lo que comparten los diseños de la entrada: el celular y su validación. Con un celular válido
 * se arma la cita de una vez; el código para confirmar que es suyo se pide al pagar.
 */
export function usePhoneEntry() {
  const t = useAppT();
  const { state, dispatch, shop } = useBookingFlow();
  const [phone, setPhone] = React.useState(state.phone);
  const [touched, setTouched] = React.useState(false);
  const isValid = nationalDigits(phone) >= MIN_DIGITS;
  // Con varias sedes, desde que abre la primera hasta que cierra la última.
  const opensAt = shop.branches.map((branch) => branch.opensAt).sort()[0] ?? "09:00";
  const closesAt = shop.branches.map((branch) => branch.closesAt).sort().at(-1) ?? "19:00";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (toastMissing(t, [!isValid && t("booking.phone.invalid")])) return;
    dispatch({ type: "startWithPhone", phone, onlyBranchId: shop.branches.length === 1 ? (shop.branches[0]?.id ?? null) : null });
  };

  const error = touched && !isValid ? t("booking.phone.invalid") : undefined;
  return { phone, setPhone, submit, error, isPending: false, opensAt, closesAt };
}

export type PhoneEntry = ReturnType<typeof usePhoneEntry>;

