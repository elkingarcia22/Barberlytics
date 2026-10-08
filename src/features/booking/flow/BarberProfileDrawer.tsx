import { useAppT } from "@/app/i18n";
import { DrawerShell } from "@/components/overlays";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initialsOf } from "../bookingFormat";
import type { BookingBarber } from "../types";
import { useBookingFlow } from "./BookingContext";
import { DRAWER_FIT_STYLE } from "./drawerFit";

interface BarberProfileDrawerProps {
  barber: BookingBarber | null;
  serviceIds: readonly string[];
  onOpenChange: (open: boolean) => void;
  onChoose: (barber: BookingBarber) => void;
}

/** El perfil de un barbero: quién es, sus trabajos y lo que cobra por cada servicio. */
export function BarberProfileDrawer({ barber, serviceIds, onOpenChange, onChoose }: BarberProfileDrawerProps) {
  const t = useAppT();
  const { catalog, fmt, layout } = useBookingFlow();
  const services = (catalog?.services ?? []).filter((service) => barber?.prices[service.id] !== undefined);

  return (
    <DrawerShell
      open={barber !== null}
      onOpenChange={onOpenChange}
      side={layout === "wide" ? "right" : "bottom"}
      contentStyle={DRAWER_FIT_STYLE}
      title={barber?.name ?? ""}
      description={barber?.level ?? undefined}
      leading={
        barber ? (
          <Avatar size="lg">
            {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
            <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
          </Avatar>
        ) : null
      }
      actions={
        barber ? (
          <Button type="button" size="lg" className="w-full" onClick={() => onChoose(barber)}>
            {t("booking.barber.choose", { name: barber.name.split(" ")[0] ?? barber.name })}
          </Button>
        ) : null
      }
    >
      {barber && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-1.5">
            <Heading level={6}>{t("booking.barber.about", { name: barber.name.split(" ")[0] ?? barber.name })}</Heading>
            <Text tone="secondary">{barber.description}</Text>
            <Text size="sm" tone="muted" className="flex items-center gap-1">
              <span className="text-warning" aria-hidden>
                ★
              </span>
              <span className="tabular-nums">{barber.rating.toFixed(1)}</span>· {t("booking.barber.reviews", { count: barber.reviews })}
            </Text>
          </section>
          {barber.gallery.length > 0 && (
            <section className="flex flex-col gap-2">
              <Heading level={6}>{t("booking.barber.work")}</Heading>
              <div className="-mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
                {barber.gallery.map((src) => (
                  <img key={src} src={src} alt="" width={160} height={200} loading="lazy" className="h-48 w-40 shrink-0 snap-start rounded-xl object-cover" />
                ))}
              </div>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <Heading level={6}>{t("booking.barber.prices")}</Heading>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <Text size="sm" weight={serviceIds.includes(service.id) ? "semibold" : "normal"}>
                    {service.name}
                  </Text>
                  <Text size="sm" tabular tone="secondary">
                    {fmt.money(barber.prices[service.id] ?? service.price)}
                  </Text>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </DrawerShell>
  );
}
