import { Award, CalendarClock, ClipboardCheck, MessageCircle } from "lucide-react";
import { ActivityDropdown, type ActivityItem } from "@/components/ui/activity-dropdown";

/** Actividad de ejemplo de una plataforma de formación. */
const ACTIVIDAD: ActivityItem[] = [
  { id: "mensaje", icon: <MessageCircle />, tone: "primary", title: "Mensaje nuevo", description: "Sara Restrepo te escribió sobre el plan de onboarding.", time: "Justo ahora" },
  { id: "insignia", icon: <Award />, tone: "positive", title: "Insignia conseguida", description: "Completaste «Seguridad en planta» con 92 %.", time: "Hace 2 min" },
  { id: "sesion", icon: <CalendarClock />, tone: "warning", title: "Sesión en 30 minutos", description: "Inducción operativa · Sala Bogotá 3.", time: "Hace 3 h" },
  { id: "tarea", icon: <ClipboardCheck />, title: "Tarea asignada", description: "Revisar las 12 postulaciones de Analista de datos.", time: "Ayer" },
];

export default function ActivityDropdownDemo() {
  return <ActivityDropdown items={ACTIVIDAD} />;
}
