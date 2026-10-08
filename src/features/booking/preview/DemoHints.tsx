import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemaIcon } from "@/icons";
import { PROMOS } from "../pricing";

/**
 * Los datos para probar la demo: qué celular es un cliente que vuelve, cuál
 * está bloqueado, la tarjeta que se rechaza y el código que llega al celular. Solo
 * en la vista previa; el cliente real nunca lo ve.
 */
export function DemoHints() {
  const t = useAppT();
  const rows = [
    t("booking.preview.demoKnown", { phone: "320 217 2738" }),
    t("booking.preview.demoNew"),
    t("booking.preview.demoBlocked", { phone: "300 999 9999" }),
    t("booking.preview.demoCard", { ok: "4242 4242 4242 4242", declined: "4000 0000 0000 0002" }),
    t("booking.preview.demoOtp", { code: "246810" }),
    t("booking.preview.demoPromo", { codes: PROMOS.map((promo) => promo.code).join(", ") }),
    t("booking.preview.demoGift", { code: "REGALO-50" }),
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
