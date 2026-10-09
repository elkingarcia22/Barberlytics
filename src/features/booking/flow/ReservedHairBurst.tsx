import * as React from "react";
import { HairBurst } from "@/components/atmosphere";
import { useBookingFlow } from "./BookingContext";

/**
 * La celebración de una cita recién creada: pelo de barba que estalla como
 * confeti sobre la reserva. Vive en la raíz de `BookingFlow`, así sale igual
 * en las cuatro versiones (Paso a paso, las dos agendas y la Conversación).
 * Solo salta con una reserva nueva: la que ya estaba al montar (se volvió a
 * la confirmación) no se celebra otra vez.
 */
export function ReservedHairBurst() {
  const { state } = useBookingFlow();
  const reservationId = state.reservation?.id ?? null;
  const seen = React.useRef(reservationId);
  const [burstId, setBurstId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!reservationId || seen.current === reservationId) return;
    seen.current = reservationId;
    setBurstId(reservationId);
  }, [reservationId]);

  if (!burstId) return null;
  return <HairBurst key={burstId} className="z-toast" onDone={() => setBurstId(null)} />;
}
