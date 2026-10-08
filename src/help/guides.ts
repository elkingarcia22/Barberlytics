import { CalendarPlus, Link2, Lock, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Localized } from "@/i18n";

/** Un paso de una guía: lo que se hace, con los botones tal cual salen en pantalla. */
export interface HelpGuideStep {
  title: Localized;
  detail?: Localized;
}

/**
 * Una experiencia guiada: una tarea concreta partida en pasos que se marcan.
 *
 * Hoy es una lista para seguir con la app al lado; con el rediseño cada paso
 * podrá señalar su botón dentro de la pantalla. Los textos salen de los
 * artículos del centro de ayuda comprobados en producción, así que dicen lo
 * mismo que el artículo al que enlazan, en los dos idiomas del contenido.
 */
export interface HelpGuide {
  id: string;
  title: Localized;
  description: Localized;
  icon: LucideIcon;
  minutes: number;
  /** El artículo con el detalle y las capturas. */
  articleId: string;
  steps: readonly HelpGuideStep[];
}

export const HELP_GUIDES: readonly HelpGuide[] = [
  {
    id: "crear-una-cita",
    title: { es: "Crear una cita", en: "Create an appointment" },
    description: { es: "Agenda a un cliente con su servicio, su barbero y su hora.", en: "Book a client with their service, their barber and their time." },
    icon: CalendarPlus,
    minutes: 1,
    articleId: "calendario/crear-una-cita",
    steps: [
      { title: { es: "Abre el Calendario", en: "Open the Calendar" }, detail: { es: "Es el segundo icono del menú.", en: "It's the second icon in the menu." } },
      { title: { es: "Toca Acciones y elige Crear cita", en: "Tap Actions and choose Create appointment" }, detail: { es: "O toca una franja vacía del barbero: se abre con el barbero y la hora puestos.", en: "Or tap an empty slot for the barber: it opens with the barber and the time already set." } },
      { title: { es: "Elige el Cliente", en: "Choose the Client" }, detail: { es: "Búscalo por nombre. Si es nuevo, toca Crear cliente; si no quiere registrarse, Walk in.", en: "Search by name. If they're new, tap Create client; if they don't want to sign up, Walk in." } },
      { title: { es: "Elige el Servicio", en: "Choose the Service" }, detail: { es: "Filtra por categoría si tienes muchos.", en: "Filter by category if you have many." } },
      { title: { es: "Elige el Barbero", en: "Choose the Barber" } },
      { title: { es: "Elige Fecha & Hora", en: "Choose Date & Time" }, detail: { es: "El día arriba y la hora en Mañana, Tarde o Noche.", en: "The day at the top and the time under Morning, Afternoon or Evening." } },
      { title: { es: "Si llegó sin cita, enciende Cliente sin cita previa", en: "If they walked in, turn on Walk-in client" }, detail: { es: "Aplica la comisión de walk-in del barbero.", en: "It applies the barber's walk-in commission." } },
      { title: { es: "Toca Crear", en: "Tap Create" } },
    ],
  },
  {
    id: "crear-un-cliente",
    title: { es: "Crear un cliente", en: "Create a client" },
    description: { es: "Registra a un cliente nuevo con sus datos de contacto.", en: "Add a new client with their contact details." },
    icon: UserPlus,
    minutes: 1,
    articleId: "clientes/crear-un-cliente",
    steps: [
      { title: { es: "Abre Clientes", en: "Open Clients" } },
      { title: { es: "Toca Crear cliente", en: "Tap Create client" } },
      { title: { es: "Escribe Primer nombre, Primer apellido, Teléfono y Correo", en: "Enter First name, Last name, Phone and Email" }, detail: { es: "Son obligatorios.", en: "They're required." } },
      { title: { es: "Completa lo demás si lo tienes", en: "Fill in the rest if you have it" }, detail: { es: "País, Estado, Ciudad, Dirección, Código Postal y Fecha de nacimiento.", en: "Country, State, City, Address, Zip Code and Date of birth." } },
      { title: { es: "Decide si Reserva y pago solo online", en: "Decide on Online-only booking and payment" } },
      { title: { es: "Toca Crear", en: "Tap Create" } },
    ],
  },
  {
    id: "cobrar-una-cita",
    title: { es: "Cobrar una cita", en: "Charge an appointment" },
    description: { es: "Cierra la cuenta del cliente con el método de pago que use.", en: "Close out the client's bill with whatever payment method they use." },
    icon: Wallet,
    minutes: 2,
    articleId: "calendario/cobrar-una-cita",
    steps: [
      { title: { es: "Toca la cita en el calendario", en: "Tap the appointment on the calendar" } },
      { title: { es: "En SIGUIENTE PASO, toca Pagar cita", en: "Under NEXT STEP, tap Pay appointment" }, detail: { es: "También está en Acciones › Cobrar.", en: "It's also under Actions › Charge." } },
      { title: { es: "Revisa el resumen", en: "Check the summary" }, detail: { es: "Si lleva algo más, usa Añadir servicio o Añadir productos.", en: "If they're getting something else, use Add service or Add products." } },
      { title: { es: "Para elegir cómo paga, toca Abrir checkout completo", en: "To choose how they pay, tap Open full checkout" } },
      { title: { es: "Elige Efectivo, Crédito/Débito, Link de pago o Pago mixto", en: "Choose Cash, Credit/Debit, Payment link or Split payment" } },
      { title: { es: "Confirma el cobro", en: "Confirm the payment" }, detail: { es: "La cita pasa a Lista de cobros › Pagado.", en: "The appointment moves to Payment list › Paid." } },
    ],
  },
  {
    id: "activar-un-barbero",
    title: { es: "Activar a un barbero en una sucursal", en: "Activate a barber at a location" },
    description: { es: "Haz que alguien de tu equipo aparezca en otra sucursal.", en: "Make someone on your team show up at another location." },
    icon: Users,
    minutes: 1,
    articleId: "sucursales/activar-equipo-en-una-sucursal",
    steps: [
      { title: { es: "Elige la sucursal arriba", en: "Choose the location at the top" } },
      { title: { es: "Ve a Equipo", en: "Go to Team" } },
      { title: { es: "Toca Acciones › Activar equipo dentro de esta sucursal", en: "Tap Actions › Activate team in this location" } },
      { title: { es: "Busca a la persona", en: "Find the person" }, detail: { es: "En Barberos o Gerentes, y dentro en Comisión o Renta.", en: "Under Barbers or Managers, then under Commission or Rent." } },
      { title: { es: "Enciende su interruptor", en: "Turn on their switch" } },
      { title: { es: "Toca Guardar", en: "Tap Save" }, detail: { es: "Vuelves a Equipo y ya aparece en la lista.", en: "You go back to Team and they now show up in the list." } },
    ],
  },
  {
    id: "bloquear-el-calendario",
    title: { es: "Bloquear el calendario de un barbero", en: "Block a barber's calendar" },
    description: { es: "Reserva el almuerzo, una reunión o unas vacaciones.", en: "Set aside lunch, a meeting or a vacation." },
    icon: Lock,
    minutes: 1,
    articleId: "calendario/bloquear-el-calendario",
    steps: [
      { title: { es: "En el Calendario, cambia la vista a Mes", en: "In the Calendar, switch the view to Month" } },
      { title: { es: "Toca el nombre del barbero y elige Crear bloque de tiempo", en: "Tap the barber's name and choose Create time block" } },
      { title: { es: "Elige la Categoria", en: "Choose the Category" }, detail: { es: "Almuerzo, Reunión, Vacaciones, Enfermo, Festivo…", en: "Lunch, Meeting, Vacation, Sick, Holiday…" } },
      { title: { es: "Elige la Repetición", en: "Choose the Repeat" }, detail: { es: "Por ejemplo, Diariamente para el almuerzo.", en: "For example, Daily for lunch." } },
      { title: { es: "Pon las fechas y las horas", en: "Set the dates and times" } },
      { title: { es: "Toca Crear", en: "Tap Create" } },
    ],
  },
  {
    id: "compartir-enlace-de-reserva",
    title: { es: "Compartir tu enlace de reserva", en: "Share your booking link" },
    description: { es: "Para que tus clientes reserven solos desde WhatsApp o Instagram.", en: "So your clients can book on their own from WhatsApp or Instagram." },
    icon: Link2,
    minutes: 1,
    articleId: "agendamiento-online/enlace-directo-y-utm",
    steps: [
      { title: { es: "Ve a Configuración › Agendamiento online", en: "Go to Settings › Online booking" } },
      { title: { es: "Busca Enlace directo de reserva", en: "Find Direct booking link" } },
      { title: { es: "Toca Copiar", en: "Tap Copy" } },
      { title: { es: "Pégalo en tu WhatsApp, tu Instagram o tus mensajes", en: "Paste it in your WhatsApp, your Instagram or your messages" } },
      { title: { es: "Ábrelo tú primero en el celular", en: "Open it on your phone first" }, detail: { es: "Recórrelo como cliente, sin tocar ¡Reservar ahora!.", en: "Go through it as a client, without tapping Book now!." } },
    ],
  },
];
