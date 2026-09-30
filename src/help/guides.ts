import { CalendarPlus, Link2, Lock, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";

/** Un paso de una guía: lo que se hace, con los botones tal cual salen en pantalla. */
export interface HelpGuideStep {
  title: string;
  detail?: string;
}

/**
 * Una experiencia guiada: una tarea concreta partida en pasos que se marcan.
 *
 * Hoy es una lista para seguir con la app al lado; con el rediseño cada paso
 * podrá señalar su botón dentro de la pantalla. Los textos salen de los
 * artículos del centro de ayuda comprobados en producción, así que dicen lo
 * mismo que el artículo al que enlazan.
 */
export interface HelpGuide {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  minutes: number;
  /** El artículo con el detalle y las capturas. */
  articleId: string;
  steps: readonly HelpGuideStep[];
}

export const HELP_GUIDES: readonly HelpGuide[] = [
  {
    id: "crear-una-cita",
    title: "Crear una cita",
    description: "Agenda a un cliente con su servicio, su barbero y su hora.",
    icon: CalendarPlus,
    minutes: 1,
    articleId: "calendario/crear-una-cita",
    steps: [
      { title: "Abre el Calendario", detail: "Es el segundo icono del menú." },
      { title: "Toca Acciones y elige Crear cita", detail: "O toca una franja vacía del barbero: se abre con el barbero y la hora puestos." },
      { title: "Elige el Cliente", detail: "Búscalo por nombre. Si es nuevo, toca Crear cliente; si no quiere registrarse, Walk in." },
      { title: "Elige el Servicio", detail: "Filtra por categoría si tienes muchos." },
      { title: "Elige el Barbero" },
      { title: "Elige Fecha & Hora", detail: "El día arriba y la hora en Mañana, Tarde o Noche." },
      { title: "Si llegó sin cita, enciende Cliente sin cita previa", detail: "Aplica la comisión de walk-in del barbero." },
      { title: "Toca Crear" },
    ],
  },
  {
    id: "crear-un-cliente",
    title: "Crear un cliente",
    description: "Registra a un cliente nuevo con sus datos de contacto.",
    icon: UserPlus,
    minutes: 1,
    articleId: "clientes/crear-un-cliente",
    steps: [
      { title: "Abre Clientes" },
      { title: "Toca Crear cliente" },
      { title: "Escribe Primer nombre, Primer apellido, Teléfono y Correo", detail: "Son obligatorios." },
      { title: "Completa lo demás si lo tienes", detail: "País, Estado, Ciudad, Dirección, Código Postal y Fecha de nacimiento." },
      { title: "Decide si Reserva y pago solo online" },
      { title: "Toca Crear" },
    ],
  },
  {
    id: "cobrar-una-cita",
    title: "Cobrar una cita",
    description: "Cierra la cuenta del cliente con el método de pago que use.",
    icon: Wallet,
    minutes: 2,
    articleId: "calendario/cobrar-una-cita",
    steps: [
      { title: "Toca la cita en el calendario" },
      { title: "En SIGUIENTE PASO, toca Pagar cita", detail: "También está en Acciones › Cobrar." },
      { title: "Revisa el resumen", detail: "Si lleva algo más, usa Añadir servicio o Añadir productos." },
      { title: "Para elegir cómo paga, toca Abrir checkout completo" },
      { title: "Elige Efectivo, Crédito/Débito, Link de pago o Pago mixto" },
      { title: "Confirma el cobro", detail: "La cita pasa a Lista de cobros › Pagado." },
    ],
  },
  {
    id: "activar-un-barbero",
    title: "Activar a un barbero en una sucursal",
    description: "Haz que alguien de tu equipo aparezca en otra sucursal.",
    icon: Users,
    minutes: 1,
    articleId: "sucursales/activar-equipo-en-una-sucursal",
    steps: [
      { title: "Elige la sucursal arriba" },
      { title: "Ve a Equipo" },
      { title: "Toca Acciones › Activar equipo dentro de esta sucursal" },
      { title: "Busca a la persona", detail: "En Barberos o Gerentes, y dentro en Comisión o Renta." },
      { title: "Enciende su interruptor" },
      { title: "Toca Guardar", detail: "Vuelves a Equipo y ya aparece en la lista." },
    ],
  },
  {
    id: "bloquear-el-calendario",
    title: "Bloquear el calendario de un barbero",
    description: "Reserva el almuerzo, una reunión o unas vacaciones.",
    icon: Lock,
    minutes: 1,
    articleId: "calendario/bloquear-el-calendario",
    steps: [
      { title: "En el Calendario, cambia la vista a Mes" },
      { title: "Toca el nombre del barbero y elige Crear bloque de tiempo" },
      { title: "Elige la Categoria", detail: "Almuerzo, Reunión, Vacaciones, Enfermo, Festivo…" },
      { title: "Elige la Repetición", detail: "Por ejemplo, Diariamente para el almuerzo." },
      { title: "Pon las fechas y las horas" },
      { title: "Toca Crear" },
    ],
  },
  {
    id: "compartir-enlace-de-reserva",
    title: "Compartir tu enlace de reserva",
    description: "Para que tus clientes reserven solos desde WhatsApp o Instagram.",
    icon: Link2,
    minutes: 1,
    articleId: "agendamiento-online/enlace-directo-y-utm",
    steps: [
      { title: "Ve a Configuración › Agendamiento online" },
      { title: "Busca Enlace directo de reserva" },
      { title: "Toca Copiar" },
      { title: "Pégalo en tu WhatsApp, tu Instagram o tus mensajes" },
      { title: "Ábrelo tú primero en el celular", detail: "Recórrelo como cliente, sin tocar ¡Reservar ahora!." },
    ],
  },
];
