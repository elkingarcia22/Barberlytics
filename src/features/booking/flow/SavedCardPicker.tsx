import { Trash2 } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { SavedCard } from "../types";
import { CardBrandTile } from "./CardBrandMark";
import { brandFromName, cardBrandOf, cvcLengthOf, digitsOf, savedCardExpiry, type CardBrand, type CardValues } from "./cardValidation";

export const NEW_CARD = "new";

const BRAND_NAMES: Partial<Record<CardBrand, string>> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex" };

interface SavedCardPickerProps {
  cards: readonly SavedCard[];
  /** El id de la tarjeta elegida o `NEW_CARD` (la nueva que se acaba de agregar). */
  value: string;
  onChange: (value: string) => void;
  /** La tarjeta nueva ya escrita en su hoja, si la hay: aparece en la lista como «Nueva». */
  pending: CardValues | null;
  /** Abre la hoja para agregar otra tarjeta, en blanco. */
  onAddNew: () => void;
  /** Abre la hoja con la nueva ya escrita, para corregirla. */
  onEditPending: () => void;
  /** Descarta la nueva sin usarla. */
  onRemovePending: () => void;
  /** Cambiar titular o vencimiento de una guardada. */
  onEditCard: (card: SavedCard) => void;
  /** Quitar una guardada (pide confirmación). */
  onRemoveCard: (card: SavedCard) => void;
  cvc: string;
  onCvcChange: (cvc: string) => void;
  showErrors: boolean;
  now?: Date;
}

const isExpired = (card: SavedCard, now: Date): boolean => new Date(card.expYear, card.expMonth, 1).getTime() <= now.getTime();

/** Editar y quitar, a la derecha de cada tarjeta: fuera del botón que la elige. */
function CardActions({ label, onEdit, onRemove }: { label: string; onEdit: () => void; onRemove: () => void }) {
  const t = useAppT();
  return (
    <div className="flex shrink-0 items-center gap-0.5 pr-2">
      <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`${t("booking.payment.editCard")} ${label}`}>
        <ThemaIcon name="edit" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`${t("booking.payment.removeCard")} ${label}`} className="text-text-secondary hover:text-destructive">
        <Trash2 />
      </Button>
    </div>
  );
}

/**
 * Cómo paga con tarjeta: las que ya guardó (marca, •••• últimos 4, vence), la
 * nueva que acaba de agregar y «Agregar tarjeta nueva», que abre su hoja. De
 * una guardada se vuelve a pedir el CVC —que nunca se guarda— dentro de su
 * propia tarjeta, alineado con el texto. Una vencida se ve pero no se elige.
 */
export function SavedCardPicker({ cards, value, onChange, pending, onAddNew, onEditPending, onRemovePending, onEditCard, onRemoveCard, cvc, onCvcChange, showErrors, now = new Date() }: SavedCardPickerProps) {
  const t = useAppT();
  const boxClass = (selected: boolean) =>
    cn(
      "overflow-hidden rounded-xl border transition-colors duration-fast ease-out-expo motion-reduce:transition-none",
      selected ? "border-primary bg-primary/5" : "border-border bg-surface"
    );
  const rowClass = "flex w-full items-center gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 disabled:cursor-not-allowed";

  return (
    <div role="radiogroup" aria-label={t("booking.payment.savedCards")} className="flex flex-col gap-2">
      {(cards.length > 0 || pending) && (
        <Text size="xs" tone="muted">
          {t("booking.payment.savedCards")}
        </Text>
      )}
      {cards.map((card) => {
        const brand = brandFromName(card.brand);
        const expired = isExpired(card, now);
        const selected = value === card.id;
        const cvcError = showErrors && digitsOf(cvc).length !== cvcLengthOf(brand);
        return (
          <div key={card.id} className={boxClass(selected)}>
            <div className="flex items-center">
              <button type="button" role="radio" aria-checked={selected} disabled={expired} onClick={() => onChange(card.id)} className={cn(rowClass, "flex-1", !selected && !expired && "hover:bg-surface-subtle", expired && "opacity-60")}>
                <CardBrandTile brand={brand} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Text as="span" size="sm" weight="medium" tabular>
                    {card.brand} •••• {card.last4}
                  </Text>
                  <Text as="span" size="xs" tone="muted" tabular>
                    {t("booking.payment.savedCardExpires", { date: savedCardExpiry(card) })}
                  </Text>
                </span>
                {expired ? <Badge variant="negative">{t("booking.payment.cardExpired")}</Badge> : selected && <ThemaIcon name="check" size="sm" tone="primary" />}
              </button>
              {/* Una vencida no se elige, pero sí se edita (llegó la renovación) o se quita. */}
              <CardActions label={`${card.brand} ${card.last4}`} onEdit={() => onEditCard(card)} onRemove={() => onRemoveCard(card)} />
            </div>
            {selected && (
              // El CVC va dentro de la tarjeta elegida, alineado con su texto: se lee como parte de ella.
              <div className="flex items-center gap-3 border-t border-primary/20 py-2.5 pl-[4.5rem] pr-3">
                <label htmlFor={`cvc-${card.id}`} className="shrink-0">
                  <Text as="span" size="sm" weight="medium">
                    CVC
                  </Text>
                </label>
                <Input
                  id={`cvc-${card.id}`}
                  value={cvc}
                  onChange={(event) => onCvcChange(digitsOf(event.target.value).slice(0, cvcLengthOf(brand)))}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder={brand === "amex" ? "1234" : "123"}
                  aria-invalid={cvcError || undefined}
                  aria-describedby={`cvc-hint-${card.id}`}
                  className="h-9 w-20 shrink-0 text-center tabular-nums"
                />
                <Text id={`cvc-hint-${card.id}`} as="span" size="xs" tone={cvcError ? "negative" : "muted"} className="min-w-0">
                  {cvcError ? t("booking.payment.cvcMissing") : t(brand === "amex" ? "booking.payment.cvcHintAmex" : "booking.payment.cvcHint")}
                </Text>
              </div>
            )}
          </div>
        );
      })}

      {pending && (
        <div className={boxClass(value === NEW_CARD)}>
          <div className="flex items-center">
            <button type="button" role="radio" aria-checked={value === NEW_CARD} onClick={() => onChange(NEW_CARD)} className={cn(rowClass, "flex-1", value !== NEW_CARD && "hover:bg-surface-subtle")}>
              <CardBrandTile brand={cardBrandOf(pending.number)} />
              <span className="flex min-w-0 flex-1 flex-col">
                <Text as="span" size="sm" weight="medium" tabular>
                  {BRAND_NAMES[cardBrandOf(pending.number)] ?? t("booking.payment.card")} •••• {digitsOf(pending.number).slice(-4)}
                </Text>
                <Text as="span" size="xs" tone="muted" tabular>
                  {t("booking.payment.newCardTag")} · {t("booking.payment.savedCardExpires", { date: pending.expiry })}
                </Text>
              </span>
              {value === NEW_CARD && <ThemaIcon name="check" size="sm" tone="primary" />}
            </button>
            <CardActions label={digitsOf(pending.number).slice(-4)} onEdit={onEditPending} onRemove={onRemovePending} />
          </div>
        </div>
      )}

      <button type="button" onClick={onAddNew} className={cn(boxClass(false), rowClass, "border-dashed hover:bg-surface-subtle")}>
        <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-text-secondary">
          <ThemaIcon name="plus" size="sm" />
        </span>
        <Text as="span" size="sm" weight="medium" className="flex-1">
          {pending ? t("booking.payment.otherCard") : t("booking.payment.newCard")}
        </Text>
        <ThemaIcon name="chevronRight" size="xs" tone="muted" />
      </button>
    </div>
  );
}
