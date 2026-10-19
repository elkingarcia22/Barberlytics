import * as React from "react";
import { Pencil } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { NumberField } from "@/components/forms";
import { Button } from "@/components/ui/button";

/**
 * El precio de una línea del cobro. Quien puede cambiarlo lo ve como un botón
 * con lápiz: al tocarlo se vuelve un campo y, al salir, queda el nuevo (vacío
 * vuelve al de lista). Sin permiso, solo el importe.
 */
export function CheckoutPrice({ value, listPrice, editable, label, format, onChange }: { value: number; listPrice: number; editable: boolean; label: string; format: (value: number) => string; onChange: (next: number | null) => void }) {
  const t = useAppT();
  const [editing, setEditing] = React.useState(false);
  if (!editable) return <>{format(value)}</>;
  if (editing) {
    return (
      <NumberField
        autoFocus
        value={value}
        onValueChange={(next) => onChange(next === null || next === listPrice ? null : Math.max(0, next))}
        // Al entrar se selecciona el importe: lo normal es escribir uno nuevo encima.
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => setEditing(false)}
        onKeyDown={(event) => event.key === "Enter" && setEditing(false)}
        min={0}
        step={1}
        prefix="$"
        size="sm"
        className="w-28"
        aria-label={t("calendar.checkout.priceFor", { name: label })}
        data-testid="checkout-price-input"
      />
    );
  }
  return (
    <Button variant="ghost" size="xs" className="tabular-nums" onClick={() => setEditing(true)} aria-label={t("calendar.checkout.editPrice", { name: label, price: format(value) })} data-testid="checkout-price">
      {format(value)}
      <Pencil />
    </Button>
  );
}
