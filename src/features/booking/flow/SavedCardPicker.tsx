import { useAppT } from "@/app/i18n";
import { Field } from "@/components/forms";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { SavedCard } from "../types";
import { CardBrandMark } from "./CardBrandMark";
import { brandFromName, cvcLengthOf, digitsOf } from "./cardValidation";

export const NEW_CARD = "new";

interface SavedCardPickerProps {
  cards: readonly SavedCard[];
  /** El id de la tarjeta elegida o `NEW_CARD`. */
  value: string;
  onChange: (value: string) => void;
  cvc: string;
  onCvcChange: (cvc: string) => void;
  showErrors: boolean;
  now?: Date;
}

const isExpired = (card: SavedCard, now: Date): boolean => new Date(card.expYear, card.expMonth, 1).getTime() <= now.getTime();
const expiryOf = (card: SavedCard): string => `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;

/**
 * Las tarjetas que ya guardó, para pagar sin volver a escribirlas, y «Agregar
 * tarjeta nueva». De una guardada solo se conoce la marca, los últimos cuatro
 * dígitos y el vencimiento; por seguridad se vuelve a pedir su CVC, que no se
 * guarda nunca. Una vencida se ve pero no se puede elegir.
 */
export function SavedCardPicker({ cards, value, onChange, cvc, onCvcChange, showErrors, now = new Date() }: SavedCardPickerProps) {
  const t = useAppT();
  const rowClass = (selected: boolean, disabled = false) =>
    cn(
      "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-fast ease-out-expo motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      selected ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-surface-subtle",
      disabled && "cursor-not-allowed opacity-60 hover:bg-surface"
    );

  return (
    <div role="radiogroup" aria-label={t("booking.payment.savedCards")} className="flex flex-col gap-2">
      <Text size="xs" tone="muted">
        {t("booking.payment.savedCards")}
      </Text>
      {cards.map((card) => {
        const brand = brandFromName(card.brand);
        const expired = isExpired(card, now);
        const selected = value === card.id;
        return (
          <div key={card.id} className="flex flex-col gap-2">
            <button type="button" role="radio" aria-checked={selected} disabled={expired} onClick={() => onChange(card.id)} className={rowClass(selected, expired)}>
              <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-text-primary">
                <CardBrandMark brand={brand} className={brand === "visa" ? "text-sm" : undefined} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium" tabular>
                  {card.brand} •••• {card.last4}
                </Text>
                <Text as="span" size="xs" tone="muted" tabular>
                  {t("booking.payment.savedCardExpires", { date: expiryOf(card) })}
                </Text>
              </span>
              {expired ? <Badge variant="negative">{t("booking.payment.cardExpired")}</Badge> : selected && <ThemaIcon name="check" size="sm" tone="primary" />}
            </button>
            {selected && (
              <Field label={t("booking.payment.cvcAgain")} description={t(brand === "amex" ? "booking.payment.cvcHintAmex" : "booking.payment.cvcHint")} error={showErrors && digitsOf(cvc).length !== cvcLengthOf(brand) ? t("booking.payment.cardError") : undefined} className="pl-[3.75rem]">
                <Input value={cvc} onChange={(event) => onCvcChange(digitsOf(event.target.value).slice(0, cvcLengthOf(brand)))} inputMode="numeric" autoComplete="cc-csc" placeholder={brand === "amex" ? "1234" : "123"} className="max-w-[8rem]" />
              </Field>
            )}
          </div>
        );
      })}
      <button type="button" role="radio" aria-checked={value === NEW_CARD} onClick={() => onChange(NEW_CARD)} className={rowClass(value === NEW_CARD)}>
        <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-text-secondary">
          <ThemaIcon name="plus" size="sm" />
        </span>
        <Text as="span" size="sm" weight="medium" className="flex-1">
          {t("booking.payment.newCard")}
        </Text>
        {value === NEW_CARD && <ThemaIcon name="check" size="sm" tone="primary" />}
      </button>
    </div>
  );
}
