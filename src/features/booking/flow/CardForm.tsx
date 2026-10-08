import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CardBrandMark } from "./CardBrandMark";
import { CardPreview, type CardField } from "./CardPreview";
import { cardBrandOf, cardErrors, cvcLengthOf, digitsOf, groupCard, groupExpiry, type CardValues } from "./cardValidation";

interface CardFormProps {
  values: CardValues;
  onChange: (values: CardValues) => void;
  showErrors: boolean;
  /** Lo que dijo la pasarela (número inválido, rechazada). */
  serverError?: string;
  /** Guardarla tokenizada para la próxima; sin `onSaveChange` no se ofrece (p. ej. sin perfil). */
  save?: boolean;
  onSaveChange?: (save: boolean) => void;
}

/**
 * Una tarjeta nueva: la tarjeta dibujada arriba refleja lo que se escribe y
 * marca dónde va cada dato (el CVC la voltea). Debajo, los cuatro campos con el
 * teclado numérico del celular y el autocompletado del navegador (`cc-*`), y la
 * opción de guardarla. En la demo no sale nada de aquí: la pasarela simulada
 * solo mira que el número sea válido.
 */
export function CardForm({ values, onChange, showErrors, serverError, save = false, onSaveChange }: CardFormProps) {
  const t = useAppT();
  const [focused, setFocused] = React.useState<CardField | null>(null);
  const errors = cardErrors(values);
  const brand = cardBrandOf(values.number);
  const message = t("booking.payment.cardError");
  const field = (key: CardField, format?: (value: string) => string) => ({
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [key]: format ? format(event.target.value) : event.target.value }),
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((current) => (current === key ? null : current)),
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <CardPreview values={values} focused={focused} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("booking.payment.cardNumber")} className="col-span-2" error={serverError ?? (showErrors && errors.number ? message : undefined)}>
          <div className="relative">
            <Input {...field("number", groupCard)} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" className="pr-14" />
            {brand !== "other" && <CardBrandMark brand={brand} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />}
          </div>
        </Field>
        <Field label={t("booking.payment.cardExpiry")} error={showErrors && errors.expiry ? message : undefined}>
          <Input {...field("expiry", groupExpiry)} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" />
        </Field>
        <Field label={t("booking.payment.cardCvc")} error={showErrors && errors.cvc ? message : undefined}>
          <Input {...field("cvc", (value) => digitsOf(value).slice(0, cvcLengthOf(brand)))} inputMode="numeric" autoComplete="cc-csc" placeholder={brand === "amex" ? "1234" : "123"} />
        </Field>
        <Field label={t("booking.payment.cardName")} className="col-span-2" error={showErrors && errors.name ? message : undefined}>
          <Input {...field("name")} autoComplete="cc-name" placeholder={t("booking.card.holderExample")} />
        </Field>
      </div>
      {onSaveChange && (
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox checked={save} onCheckedChange={(checked) => onSaveChange(checked === true)} className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <Text as="span" size="sm" weight="medium">
              {t("booking.payment.saveCard")}
            </Text>
            <Text as="span" size="xs" tone="muted">
              {t("booking.payment.saveCardHint")}
            </Text>
          </span>
        </label>
      )}
    </div>
  );
}
