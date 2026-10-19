import * as React from "react";
import { Mail, MessageSquareText } from "lucide-react";
import type { useAppT } from "@/app/i18n";
import type { AppointmentModel, WriteDraft } from "./useAppointmentModel";

/** Por dónde escribirle al cliente: SMS si hay celular, correo si lo dejó. */

export interface MenuLink {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

/** Los enlaces para escribirle, con el texto ya puesto si se da (el recibo, por ejemplo). */
export function writeMenu(model: AppointmentModel, t: ReturnType<typeof useAppT>, draft?: WriteDraft): MenuLink[] {
  return model.writeLinks(draft).map((link) =>
    link.channel === "sms"
      ? { id: "sms", label: t("calendar.panel.write.sms"), href: link.href, icon: <MessageSquareText className="size-4" /> }
      : { id: "email", label: t("calendar.panel.write.email"), href: link.href, icon: <Mail className="size-4" /> }
  );
}
