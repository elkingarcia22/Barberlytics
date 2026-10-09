import * as React from "react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { Text } from "@/components/typography";
import { IconTile } from "@/components/utility/IconTile";
import { ThemaIcon, type IconName } from "@/icons";
import { buildIcs, calendarUrl, downloadIcs, parseStart, type CalendarProvider } from "../bookingFormat";
import type { Reservation } from "../types";
import { useBookingFlow } from "./BookingContext";
import { BookingSheet } from "./BookingSheet";

interface CalendarOption {
  id: CalendarProvider | "apple" | "file";
  icon: IconName;
  title: AppMessageKey;
  hint: AppMessageKey;
}

/** Los calendarios más usados; Apple y «otro» se llevan el archivo, los demás se abren con la cita llena. */
const OPTIONS: readonly CalendarOption[] = [
  { id: "google", icon: "google", title: "booking.calendar.google", hint: "booking.calendar.googleHint" },
  { id: "apple", icon: "calendar", title: "booking.calendar.apple", hint: "booking.calendar.appleHint" },
  { id: "outlook", icon: "microsoft", title: "booking.calendar.outlook", hint: "booking.calendar.outlookHint" },
  { id: "office", icon: "microsoft", title: "booking.calendar.office", hint: "booking.calendar.officeHint" },
  { id: "yahoo", icon: "calendar", title: "booking.calendar.yahoo", hint: "booking.calendar.yahooHint" },
  { id: "file", icon: "download", title: "booking.calendar.file", hint: "booking.calendar.fileHint" },
];

/**
 * «Agregar al calendario»: se elige cuál. Google, Outlook, Microsoft 365 y Yahoo se abren con la
 * cita ya escrita (solo falta tocar Guardar); Apple y cualquier otro reciben el archivo .ics, que
 * el teléfono abre en su calendario. Con varias citas, se elige cuál va a los enlaces; el archivo
 * las lleva todas.
 */
export function CalendarSheet({ reservation, open, onOpenChange }: { reservation: Reservation; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useAppT();
  const { shop, fmt } = useBookingFlow();
  const [index, setIndex] = React.useState(0);
  const item = reservation.appointments[index] ?? reservation.appointments[0];
  if (!item) return null;

  const pick = (option: CalendarOption) => {
    if (option.id === "apple" || option.id === "file") {
      downloadIcs(buildIcs(reservation.appointments, shop.name), `${reservation.number}.ics`);
      return;
    }
    window.open(calendarUrl(option.id, item, shop.name), "_blank", "noopener,noreferrer");
  };

  return (
    <BookingSheet open={open} onOpenChange={onOpenChange} title={t("booking.confirmed.calendarTitle")} description={t("booking.confirmed.calendarLead")}>
      <div className="flex flex-col gap-4">
        {reservation.appointments.length > 1 && (
          <div role="radiogroup" aria-label={t("booking.calendar.which")} className="flex flex-wrap gap-2">
            {reservation.appointments.map((entry, entryIndex) => (
              <Chip key={entry.id} label={`${entry.personName.split(" ")[0]} · ${fmt.time(parseStart(entry.start))}`} selected={entryIndex === index} onClick={() => setIndex(entryIndex)} />
            ))}
          </div>
        )}
        <ListItemGroup>
          {OPTIONS.map((option) => (
            <ListItem
              key={option.id}
              leading={<IconTile size="md" shape="circle" tone="neutral" icon={<ThemaIcon name={option.icon} />} />}
              title={t(option.title)}
              description={t(option.hint)}
              meta={<ThemaIcon name={option.id === "apple" || option.id === "file" ? "download" : "arrowRight"} size="sm" tone="muted" />}
              onClick={() => pick(option)}
            />
          ))}
        </ListItemGroup>
        <Text size="xs" tone="muted" className="flex items-start gap-2">
          <ThemaIcon name="info" size="sm" />
          {t("booking.calendar.note")}
        </Text>
      </div>
    </BookingSheet>
  );
}
