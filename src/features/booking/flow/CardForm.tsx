import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { cardErrors, digitsOf, groupCard, groupExpiry, type CardValues } from "./cardValidation";

interface CardFormProps {
  values: CardValues;
  onChange: (values: CardValues) => void;
  showErrors: boolean;
  /** Lo que dijo la pasarela (número inválido, rechazada). */
  serverError?: string;
}

/**
 * La tarjeta, en cuatro campos con el teclado numérico del celular y el
 * autocompletado del navegador. En la demo no sale nada de aquí: la
 * pasarela simulada solo mira que el número sea válido.
 */
export function CardForm({ values, onChange, showErrors, serverError }: CardFormProps) {
  const t = useAppT();
  const errors = cardErrors(values);
  const set = (key: keyof CardValues, format?: (value: string) => string) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...values, [key]: format ? format(event.target.value) : event.target.value });
  const message = t("booking.payment.cardError");

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4">
      <Field label={t("booking.payment.cardNumber")} className="col-span-2" error={serverError ?? (showErrors && errors.number ? message : undefined)}>
        <Input value={values.number} onChange={set("number", groupCard)} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" />
      </Field>
      <Field label={t("booking.payment.cardExpiry")} error={showErrors && errors.expiry ? message : undefined}>
        <Input value={values.expiry} onChange={set("expiry", groupExpiry)} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" />
      </Field>
      <Field label={t("booking.payment.cardCvc")} error={showErrors && errors.cvc ? message : undefined}>
        <Input value={values.cvc} onChange={set("cvc", (value) => digitsOf(value).slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
      </Field>
      <Field label={t("booking.payment.cardName")} className="col-span-2" error={showErrors && errors.name ? message : undefined}>
        <Input value={values.name} onChange={set("name")} autoComplete="cc-name" />
      </Field>
    </div>
  );
}
