import type { AppointmentModel } from "./useAppointmentModel";

/** A quién se manda algo desde el panel: la cita (donde queda el mensaje) y su correo y celular, ya puestos y editables. */
export interface SendTarget {
  appointmentId: string;
  email: string;
  phone: string;
}

export const targetOf = (model: AppointmentModel): SendTarget => ({ appointmentId: model.appointment.id, email: model.email, phone: model.phone });
