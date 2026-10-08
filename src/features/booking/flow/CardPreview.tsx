import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import { CardBrandMark } from "./CardBrandMark";
import { cardBrandOf, cvcLengthOf, digitsOf, type CardValues } from "./cardValidation";

export type CardField = keyof CardValues;

const NUMBER_SLOTS = 16;
const GROUP = 4;

/** «4242 42•• •••• ••••»: lo escrito y lo que falta, en grupos de cuatro. */
function maskedNumber(value: string): string {
  const digits = digitsOf(value).slice(0, 19);
  const padded = digits.padEnd(Math.max(NUMBER_SLOTS, digits.length), "•");
  return padded.replace(new RegExp(`(.{${GROUP}})(?=.)`, "g"), "$1 ");
}

/** Resalta el dato que se está escribiendo, para que se vea dónde va en la tarjeta. */
function Region({ active, className, children }: { active: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "-mx-1.5 rounded-md px-1.5 py-0.5 ring-1 ring-transparent transition-[box-shadow,background-color] duration-fast ease-out-expo motion-reduce:transition-none",
        active && "bg-primary-foreground/10 ring-primary-foreground/70",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * La tarjeta dibujada mientras se escribe, como en las apps de pago: el número
 * se va llenando, se reconoce la marca, el campo activo se marca en su sitio y,
 * al escribir el CVC, la tarjeta se voltea para enseñar el reverso. Es solo un
 * reflejo de los campos (decorativa para el lector de pantalla).
 */
export function CardPreview({ values, focused }: { values: CardValues; focused: CardField | null }) {
  const t = useAppT();
  const brand = cardBrandOf(values.number);
  const isFlipped = focused === "cvc";
  const cvc = digitsOf(values.cvc).padEnd(cvcLengthOf(brand), "•");

  return (
    <div aria-hidden className="mx-auto w-full max-w-[20rem] [perspective:1200px]">
      <div
        className={cn(
          "relative aspect-[1.586] w-full transition-transform duration-slow ease-out-expo [transform-style:preserve-3d] motion-reduce:transition-none",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Frente */}
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/85 to-primary/60 p-4 text-primary-foreground shadow-lg [backface-visibility:hidden]">
          <span className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-primary-foreground/10" />
          <span className="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-primary-foreground/5" />
          <div className="relative flex items-start justify-between">
            <span className="grid h-7 w-10 grid-cols-3 gap-px overflow-hidden rounded-md bg-primary-foreground/30 p-1">
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className="rounded-[2px] bg-primary-foreground/30" />
              ))}
            </span>
            <CardBrandMark brand={brand} />
          </div>
          <Region active={focused === "number"} className="relative">
            <span className="block whitespace-nowrap font-mono text-lg tracking-widest tabular-nums">{maskedNumber(values.number)}</span>
          </Region>
          <div className="relative flex items-end justify-between gap-3">
            <Region active={focused === "name"} className="min-w-0 flex-1">
              <span className="block text-[0.625rem] uppercase tracking-wider opacity-70">{t("booking.card.holder")}</span>
              <span className="block truncate text-sm font-medium uppercase tracking-wide">{values.name.trim() || t("booking.card.holderPlaceholder")}</span>
            </Region>
            <Region active={focused === "expiry"} className="shrink-0 text-right">
              <span className="block text-[0.625rem] uppercase tracking-wider opacity-70">{t("booking.card.expires")}</span>
              <span className="block font-mono text-sm tabular-nums">{values.expiry || "MM/AA"}</span>
            </Region>
          </div>
        </div>

        {/* Reverso: la banda, la firma y el CVC */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-primary/70 via-primary/85 to-primary py-5 text-primary-foreground shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="h-9 w-full bg-black/70" />
          <div className="mt-4 flex items-center gap-3 px-4">
            <span className="h-8 flex-1 rounded-sm bg-primary-foreground/80" />
            <Region active={focused === "cvc"} className="shrink-0">
              <span className="block text-[0.625rem] uppercase tracking-wider opacity-70">CVC</span>
              <span className="block font-mono text-base tracking-widest tabular-nums">{cvc}</span>
            </Region>
          </div>
          <div className="mt-auto flex justify-end px-4">
            <CardBrandMark brand={brand} />
          </div>
        </div>
      </div>
    </div>
  );
}
