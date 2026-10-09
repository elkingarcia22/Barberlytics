import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Heading, Text } from "@/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { initialsOf, parseStart } from "../bookingFormat";
import type { BookedAppointment, Reservation } from "../types";
import { useBookingFlow } from "./BookingContext";
import { BookingSheet } from "./BookingSheet";

/** Una fila del detalle: icono, qué es y su valor; con acción opcional a la derecha. */
function Row({ icon, leading, label, children, action }: { icon?: IconName; leading?: React.ReactNode; label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      {leading ?? <IconTile size="sm" shape="circle" tone="neutral" icon={<ThemaIcon name={icon ?? "info"} />} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Text size="xs" tone="muted">
          {label}
        </Text>
        <div className="min-w-0 text-sm text-text-primary">{children}</div>
      </div>
      {action}
    </div>
  );
}

function AppointmentDetail({ item }: { item: BookedAppointment }) {
  const t = useAppT();
  const { shop, catalog, fmt } = useBookingFlow();
  const start = parseStart(item.start);
  const end = new Date(start.getTime() + item.durationMin * 60_000);
  const image = catalog?.services.find((service) => item.serviceIds.includes(service.id))?.imageUrl;
  const branch = shop.branches.find((entry) => entry.id === item.branchId);
  const mapsUrl = branch ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.address}, ${branch.city}`)}` : null;

  return (
    <article className="flex flex-col">
      <div className="flex items-start gap-4 pb-4">
        <IconTile size="xl" src={image} icon={<ThemaIcon name="scissors" />} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Heading level={4} className="first-letter:uppercase">
            {fmt.dayLong(start)}
          </Heading>
          <Text tabular>
            {fmt.time(start)} – {fmt.time(end)}
          </Text>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{t("booking.manage.status.scheduled")}</Badge>
            <Text size="xs" tone="muted">
              {t("booking.review.minutes", { count: item.durationMin })}
            </Text>
          </div>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border border-y border-border">
        <Row icon="scissors" label={t("booking.confirmed.detailService")} action={<Text weight="semibold" tabular>{fmt.money(item.price)}</Text>}>
          {item.serviceNames.join(" + ")}
        </Row>
        <Row
          label={t("booking.confirmed.detailBarber")}
          leading={
            <Avatar className="size-7">
              {item.barberAvatarUrl && <AvatarImage src={item.barberAvatarUrl} alt="" />}
              <AvatarFallback>{initialsOf(item.barberName)}</AvatarFallback>
            </Avatar>
          }
        >
          {item.barberName}
          {item.noPreference && <Text as="span" size="xs" tone="muted">{` · ${t("booking.review.noPreference")}`}</Text>}
        </Row>
        <Row icon="users" label={t("booking.confirmed.detailFor")}>
          {item.personName}
          {item.guestRelation && <Text as="span" size="xs" tone="muted">{` · ${item.guestRelation}`}</Text>}
        </Row>
        <Row
          icon="building"
          label={t("booking.confirmed.detailBranch")}
          action={
            mapsUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <ThemaIcon name="compass" />
                  {t("booking.confirmed.detailDirections")}
                </a>
              </Button>
            )
          }
        >
          <span className="block truncate">{item.branchName}</span>
          {branch && <Text as="span" size="xs" tone="muted" className="block truncate">{`${branch.address}, ${branch.city}`}</Text>}
        </Row>
      </div>
    </article>
  );
}

/**
 * «Ver detalle»: la cita como una ficha — el día grande, la hora de inicio a fin, y debajo qué,
 * con quién, para quién y dónde (con «Cómo llegar»). Abajo, cuándo se puede cambiar y el acceso
 * a «Mis citas».
 */
export function AppointmentDetailSheet({ reservation, open, onOpenChange }: { reservation: Reservation; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useAppT();
  const { shop, dispatch } = useBookingFlow();
  return (
    <BookingSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("booking.confirmed.detailTitle")}
      description={t("booking.confirmed.number", { number: reservation.number })}
      actions={
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            onOpenChange(false);
            dispatch({ type: "openManage" });
          }}
        >
          <ThemaIcon name="calendar" />
          {t("booking.confirmed.detailManage")}
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {reservation.appointments.map((item) => (
          <AppointmentDetail key={item.id} item={item} />
        ))}
        <Text size="xs" tone="muted" className="flex items-start gap-2">
          <ThemaIcon name="clock" size="sm" />
          {t("booking.confirmed.detailPolicy", { hours: shop.cancelHours })}
        </Text>
      </div>
    </BookingSheet>
  );
}
