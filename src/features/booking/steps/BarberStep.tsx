import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { initialsOf } from "../bookingFormat";
import { useBookingFlow } from "../flow/BookingContext";
import { BarberProfileDrawer } from "../flow/BarberProfileDrawer";
import { StepLayout } from "../flow/StepLayout";
import type { BookingBarber } from "../types";
import { itemPrice } from "../useBookingTotals";

/**
 * El barbero: «Sin preferencia» primero —es el que más horas abre— y luego
 * cada uno con su foto, su nivel, lo que cobra por lo elegido y su perfil.
 * Solo aparecen quienes hacen todos los servicios de la cita.
 */
export function BarberStep() {
  const t = useAppT();
  const { state, dispatch, catalog, fmt, layout } = useBookingFlow();
  const [profile, setProfile] = React.useState<BookingBarber | null>(null);
  const serviceIds = state.draft?.serviceIds ?? [];
  const lastBarberId = state.customer?.lastVisit?.barberId ?? null;
  const able = (catalog?.barbers ?? [])
    .filter((barber) => serviceIds.every((id) => barber.prices[id] !== undefined))
    // El de la última vez va primero: es a quien la mayoría vuelve.
    .sort((a, b) => Number(b.id === lastBarberId) - Number(a.id === lastBarberId));
  const choose = (barberId: string | null) => dispatch({ type: "chooseBarber", barberId });

  return (
    <StepLayout title={t("booking.barber.title")} lead={t("booking.barber.lead")}>
      {able.length === 0 ? (
        <Text tone="warning" className="flex items-start gap-2">
          <ThemaIcon name="warning" size="sm" tone="warning" />
          {t("booking.barber.none")}
        </Text>
      ) : (
        <div role="radiogroup" aria-label={t("booking.barber.title")} className={cn("grid grid-cols-1 gap-3", layout === "wide" && "lg:grid-cols-2")}>
          {able.length > 1 && (
            <MagicCard role="radio" aria-label={t("booking.barber.any")} aria-checked={false} isSelected={false} onClick={() => choose(null)} contentClassName="items-center gap-3 text-left">
              <IconTile size="lg" shape="circle" icon={<ThemaIcon name="users" />} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text weight="semibold">{t("booking.barber.any")}</Text>
                <Text size="xs" tone="secondary">
                  {t("booking.barber.anyLead")}
                </Text>
              </span>
              <Text size="sm" weight="medium" tabular as="span">
                {t("booking.services.from", { price: fmt.money(itemPrice({ serviceIds, barberId: null }, catalog)) })}
              </Text>
            </MagicCard>
          )}
          {able.map((barber) => (
            <div key={barber.id} className="relative">
              <MagicCard role="radio" aria-label={barber.name} aria-checked={state.draft?.barberId === barber.id} isSelected={state.draft?.barberId === barber.id} onClick={() => choose(barber.id)} contentClassName="items-center gap-3 pr-24 text-left">
                <Avatar size="lg">
                  {barber.avatarUrl && <AvatarImage src={barber.avatarUrl} alt="" />}
                  <AvatarFallback>{initialsOf(barber.name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Text weight="semibold" truncate>
                    {barber.name}
                  </Text>
                  <Text size="xs" tone="secondary" className="flex items-center gap-1">
                    {barber.id === lastBarberId ? <span className="font-medium text-primary">{t("booking.barber.lastTime")}</span> : barber.level}
                    <span aria-hidden>·</span>
                    <span className="text-warning" aria-hidden>
                      ★
                    </span>
                    <span className="tabular-nums">{barber.rating.toFixed(1)}</span>
                    <span className="text-text-muted">({t("booking.barber.reviews", { count: barber.reviews })})</span>
                  </Text>
                  <Text size="sm" weight="medium" tabular as="span">
                    {fmt.money(itemPrice({ serviceIds, barberId: barber.id }, catalog))}
                  </Text>
                </span>
              </MagicCard>
              {/* El perfil es otro botón, fuera de la tarjeta: un botón no va dentro de otro. */}
              <Button type="button" variant="ghost" size="xs" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setProfile(barber)}>
                {t("booking.barber.profile")}
              </Button>
            </div>
          ))}
        </div>
      )}
      <BarberProfileDrawer
        barber={profile}
        serviceIds={serviceIds}
        onOpenChange={(open) => !open && setProfile(null)}
        onChoose={(barber) => {
          setProfile(null);
          choose(barber.id);
        }}
      />
    </StepLayout>
  );
}
