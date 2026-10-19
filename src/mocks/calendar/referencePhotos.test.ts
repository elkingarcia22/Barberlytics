import { beforeEach, describe, expect, test } from "vitest";
import { addDays, format } from "date-fns";
import { db } from "../db";
import { appointmentsOn } from "./handlers";

/**
 * Las fotos del corte que se dejan desde la agenda (el panel de la cita): el
 * PATCH de la cita las guarda con las mismas reglas que la reserva en línea.
 */

const TOKEN = "mock-acc_admin-photos";
/** Una imagen válida y diminuta (1×1 px, PNG). */
const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** Una cita agendada de los próximos días (el mock las genera al pedir el día). */
function scheduledAppointment() {
  for (let offset = 1; offset <= 14; offset += 1) {
    const found = appointmentsOn("ma", format(addDays(new Date(), offset), "yyyy-MM-dd")).find((item) => item.status === "scheduled");
    if (found) return found;
  }
  throw new Error("No hay citas agendadas en las próximas dos semanas.");
}

const patch = (id: string, body: unknown) =>
  fetch(`http://localhost/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(body) });

describe("PATCH /appointments/:id con fotos del corte", () => {
  beforeEach(() => {
    db.reset();
    db.sessions.set(TOKEN, "acc_admin");
  });

  test("guarda la nota y las fotos para el barbero", async () => {
    const appointment = scheduledAppointment();
    const response = await patch(appointment.id, { notes: "Degradado bajo", referencePhotos: [PHOTO] });
    expect(response.status).toBe(200);
    const saved = db.calendar.appointments.find((item) => item.id === appointment.id)!;
    expect(saved.notes).toBe("Degradado bajo");
    expect(saved.referencePhotos).toEqual([PHOTO]);
  });

  test("rechaza lo que no es una imagen o más de tres fotos", async () => {
    const appointment = scheduledAppointment();
    expect((await patch(appointment.id, { referencePhotos: ["https://ejemplo.com/foto.jpg"] })).status).toBe(422);
    expect((await patch(appointment.id, { referencePhotos: [PHOTO, PHOTO, PHOTO, PHOTO] })).status).toBe(422);
  });
});
