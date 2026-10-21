import * as React from "react";
import { APP_MESSAGES } from "@/app/i18n";
import { LocaleProvider } from "@/i18n";
import { useBookingAppearance } from "./useBookingAppearance";

/** Las páginas que ve el cliente fuera de la reserva (confirmar la cita, pagar el anticipo), con su apariencia. */
export function BookingAppearance({ children }: { children: React.ReactNode }) {
  const locale = useBookingAppearance();
  return (
    <LocaleProvider forcedLocale={locale} messages={APP_MESSAGES}>
      {children}
    </LocaleProvider>
  );
}
