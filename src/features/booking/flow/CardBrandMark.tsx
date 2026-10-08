import { cn } from "@/lib/utils";
import type { CardBrand } from "./cardValidation";

/**
 * La marca de la red como se reconoce de un vistazo: el nombre en su estilo o,
 * en Mastercard, los dos círculos. Decorativa: el nombre ya va en el texto.
 */
export function CardBrandMark({ brand, className }: { brand: CardBrand; className?: string }) {
  if (brand === "mastercard") {
    return (
      <span aria-hidden className={cn("relative inline-flex h-6 w-10 shrink-0 items-center", className)}>
        <span className="absolute left-0 size-6 rounded-full bg-destructive/90" />
        <span className="absolute right-0 size-6 rounded-full bg-warning/90 mix-blend-screen" />
      </span>
    );
  }
  if (brand === "amex") {
    return (
      <span aria-hidden className={cn("inline-flex shrink-0 items-center rounded-sm border border-current px-1 text-xs font-bold tracking-wider", className)}>
        AMEX
      </span>
    );
  }
  if (brand === "visa") {
    return (
      <span aria-hidden className={cn("inline-flex shrink-0 items-center text-lg font-black italic tracking-tight", className)}>
        VISA
      </span>
    );
  }
  return <span aria-hidden className={cn("inline-flex h-6 w-9 shrink-0 rounded-sm border border-current opacity-60", className)} />;
}
