/**
 * Las maneras de reservar que se pueden ver en la vista previa. No son
 * pieles: cada una parte de una pregunta distinta.
 * - `guided` (Paso a paso): «¿quién eres?» y una decisión por pantalla.
 * - `agenda` (Agenda abierta): «¿cuándo puedes venir?»; las horas de todos a la vista y quién eres al final.
 * - `agenda-select` (Agenda con selector): la misma agenda abierta, pero lo que
 *   se va a hacer se elige en un campo que abre la carta en un modal, en vez de
 *   una tira de chips; día y hora, igual.
 * - `chat` (Conversación): «dime qué necesitas»; se reserva hablando con el asistente.
 */
export type BookingVersion = "guided" | "agenda" | "agenda-select" | "chat";
export const BOOKING_VERSIONS: readonly BookingVersion[] = ["guided", "agenda", "agenda-select", "chat"];

export const isBookingVersion = (value: string | null): value is BookingVersion => value !== null && (BOOKING_VERSIONS as readonly string[]).includes(value);
