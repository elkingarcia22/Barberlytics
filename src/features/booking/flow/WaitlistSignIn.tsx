import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import type { BookingAction } from "../bookingState";
import { AgendaIdentity } from "../variants/agenda/AgendaIdentity";
import { BookingFlowProvider, useBookingFlow } from "./BookingContext";
import { BookingSheet } from "./BookingSheet";
import { WaitlistCard } from "./WaitlistCard";

/** Las acciones de «quién eres» que, en Paso a paso, cambiarían de pantalla. */
const IDENTITY_ACTIONS: ReadonlySet<BookingAction["type"]> = new Set(["codeSent", "customerFound", "customerIsNew", "customerBlocked", "signOut"]);

interface WaitlistSignInProps {
  day: Date;
  hasSlots: boolean;
}

/**
 * La lista de espera en Paso a paso, igual que en la Agenda: con cuenta, la tarjeta para
 * apuntarse; sin cuenta, «Avísame si se libera una hora» abre la hoja del celular y el
 * código (`AgendaIdentity`). Entrar desde aquí no mueve de la pantalla de horas y, ya
 * dentro, la tarjeta queda abierta para elegir la franja.
 */
export function WaitlistSignIn({ day, hasSlots }: WaitlistSignInProps) {
  const t = useAppT();
  const flow = useBookingFlow();
  const [open, setOpen] = React.useState(false);
  const [signedInHere, setSignedInHere] = React.useState(false);
  const { state, dispatch } = flow;
  const step = state.step;

  // Ya se sabe quién es: la hoja se cierra sola y la tarjeta se abre.
  if (open && state.customer && state.verified) {
    setOpen(false);
    setSignedInHere(true);
  }

  // El celular, el código y la ficha se resuelven en la hoja: la pantalla de horas se queda donde está.
  const inPlace = React.useMemo(
    () => ({
      ...flow,
      dispatch: (action: BookingAction) => {
        dispatch(action);
        if (IDENTITY_ACTIONS.has(action.type)) dispatch({ type: "goTo", step });
      },
    }),
    [flow, dispatch, step]
  );

  if (state.customer && state.verified) return <WaitlistCard day={day} hasSlots={hasSlots} defaultOpen={signedInHere} />;

  return (
    <>
      <Button type="button" variant="link" size="sm" className="self-start px-0" onClick={() => setOpen(true)}>
        <ThemaIcon name="notification" />
        {t("booking.agenda.waitlistSignIn")}
      </Button>
      <BookingSheet open={open} onOpenChange={setOpen} title={t("booking.agenda.signInTitle")} description={t("booking.waitlist.signInLead")}>
        <BookingFlowProvider value={inPlace}>
          <AgendaIdentity />
        </BookingFlowProvider>
      </BookingSheet>
    </>
  );
}
