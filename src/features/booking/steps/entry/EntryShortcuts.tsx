import type * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { formatPhone } from "../../bookingFormat";
import { useBookingFlow } from "../../flow/BookingContext";

const TILE = "group flex min-w-0 flex-col items-start gap-2.5 rounded-2xl border border-border bg-surface p-3 text-left outline-none transition-colors duration-fast hover:border-primary/50 hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-ring";

/** Un atajo: icono, qué hace y una pista corta. */
function TileBody({ icon, title, hint }: { icon: IconName; title: string; hint: string }): React.ReactNode {
  return (
    <>
      <IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name={icon} />} />
      <span className="flex w-full min-w-0 flex-col">
        <Text as="span" size="sm" weight="semibold" truncate>
          {title}
        </Text>
        <Text as="span" size="xs" tone="muted" tabular>
          {hint}
        </Text>
      </span>
    </>
  );
}

/**
 * Los dos atajos de la entrada que no pasan por el código: ver las citas que ya tiene y llamar a la
 * barbería. Con el icono encima del texto, para que la pista quepa completa.
 */
export function EntryShortcuts() {
  const t = useAppT();
  const { shop, dispatch } = useBookingFlow();
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" className={TILE} onClick={() => dispatch({ type: "openManage" })}>
        <TileBody icon="calendar" title={t("booking.phone.manage")} hint={t("booking.entry.manageHint")} />
      </button>
      <a href={`tel:${shop.phone}`} className={TILE}>
        <TileBody icon="phone" title={t("booking.entry.call")} hint={formatPhone(shop.phone)} />
      </a>
    </div>
  );
}
