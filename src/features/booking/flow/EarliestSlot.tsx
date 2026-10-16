interface EarliestSlotProps {
  /** La hora se cruza con otra cita de la misma persona: no se propone. */
  isBlocked?: (start: Date) => boolean;
}

/**
 * «Lo antes posible»: deshabilitado por requerimiento de diseño.
 */
export function EarliestSlot(_props: EarliestSlotProps = {}) {
  return null;
}
