import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemaIcon } from "@/icons";
import { useBookingFormat } from "../bookingFormat";
import { PROMOS, type Promo } from "../pricing";

/**
 * Los datos para probar la demo: qué celular es un cliente que vuelve, cuál
 * está bloqueado, la tarjeta que se rechaza, el código que llega al celular y cada
 * cupón con su condición (uno es solo para clientes nuevos y otro pide dos citas:
 * sin decirlo parecía que no servían). Solo en la vista previa; el cliente real nunca lo ve.
 */
export function DemoHints() {
  const t = useAppT();
  const fmt = useBookingFormat();
  const promoRow = (promo: Promo) => {
    const off = promo.type === "percent" ? `${promo.value} %` : fmt.money(promo.value);
    if (promo.firstVisitOnly) return t("booking.preview.demoPromoNew", { code: promo.code, off });
    if (promo.minAppointments) return t("booking.preview.demoPromoMin", { code: promo.code, off, count: promo.minAppointments });
    return t("booking.preview.demoPromoAny", { code: promo.code, off });
  };
  const rows = [
    t("booking.preview.demoKnown", { phone: "320 217 2738" }),
    t("booking.preview.demoNew"),
    t("booking.preview.demoBlocked", { phone: "300 999 9999" }),
    t("booking.preview.demoCard", { ok: "4242 4242 4242 4242", declined: "4000 0000 0000 0002" }),
    t("booking.preview.demoOtp", { code: "246810" }),
    ...PROMOS.map(promoRow),
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ThemaIcon name="idea" />
          {t("booking.preview.demoTitle")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row} className="flex items-start gap-2">
              <ThemaIcon name="check" size="xs" tone="primary" className="mt-1" />
              <Text size="sm" tone="secondary">
                {row}
              </Text>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
