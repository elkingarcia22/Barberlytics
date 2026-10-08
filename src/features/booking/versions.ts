/**
 * Las tres maneras de reservar que se pueden ver en la vista previa. No son
 * pieles: cada una parte de una pregunta distinta.
 * - `guided` (Paso a paso): «¿quién eres?» y una decisión por pantalla.
 * - `agenda` (Agenda abierta): «¿cuándo puedes venir?»; las horas de todos a la vista y quién eres al final.
 * - `chat` (Conversación): «dime qué necesitas»; se reserva hablando con el asistente.
 */
export type BookingVersion = "guided" | "agenda" | "chat";
export const BOOKING_VERSIONS: readonly BookingVersion[] = ["guided", "agenda", "chat"];

export const isBookingVersion = (value: string | null): value is BookingVersion => value !== null && (BOOKING_VERSIONS as readonly string[]).includes(value);
