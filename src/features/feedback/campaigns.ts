import {
  FEEDBACK_LAUNCHER_TARGET,
  type FeedbackCampaignConfig,
  type TourStep,
} from "@/components/feedback-loop";
import {
  ACTIVE_CAMPAIGN_DEFINITION,
  REDESIGN_DEFINITION,
} from "./campaignRegistry";

/**
 * Lo que solo existe en el navegador: el recorrido que presenta cada campaña.
 * La definición (id, nombre, secciones) vive en `campaignRegistry.ts`, que
 * comparte con el servidor.
 *
 * Para lanzar otra campaña: define la suya en el registro con un `id` nuevo
 * (el navegador vuelve a enseñar el recorrido a todos), dale su recorrido aquí
 * y apúntala como activa. Las respuestas van a una hoja propia por campaña.
 */
const REDESIGN_TOUR: readonly TourStep[] = [
  {
    id: "welcome",
    icon: "rocket",
    title: "Bienvenido al nuevo Barberlytics",
    description:
      "Estamos probando el rediseño con tu equipo antes de abrirlo a todas las barberías. Recórrelo como en un día normal y cuéntanos qué cambiarías.",
  },
  {
    id: "menu",
    icon: "compass",
    // El rail compacto en escritorio; el menú desplegado si es el que se ve.
    target: 'nav[aria-label="Navegación compacta"], aside',
    title: "Navega por los módulos",
    description:
      "Desde el menú llegas a métricas, calendario, equipo y configuración. Entra a los que usas a diario.",
  },
  {
    id: "context",
    icon: "pointer",
    target: "main h1",
    title: "Cada comentario sabe dónde estás",
    description:
      "Al escribir guardamos la página en la que estás. No hace falta explicar dónde lo viste: cuéntanos qué cambiarías.",
  },
  {
    id: "launcher",
    icon: "feedback",
    target: FEEDBACK_LAUNCHER_TARGET,
    title: "Queremos tu feedback",
    description:
      "Este botón te acompaña en todas las pantallas. Úsalo cuantas veces quieras: lo que falta, lo que sobra o lo que no se entiende.",
  },
];

export const REDESIGN_CAMPAIGN: FeedbackCampaignConfig = {
  ...REDESIGN_DEFINITION,
  tour: REDESIGN_TOUR,
};

const CAMPAIGNS: Readonly<Record<string, FeedbackCampaignConfig>> = {
  [REDESIGN_CAMPAIGN.id]: REDESIGN_CAMPAIGN,
};

/** La campaña activa con su recorrido, o `null` si no se está escuchando. */
export const ACTIVE_FEEDBACK_CAMPAIGN: FeedbackCampaignConfig | null =
  ACTIVE_CAMPAIGN_DEFINITION
    ? (CAMPAIGNS[ACTIVE_CAMPAIGN_DEFINITION.id] ?? null)
    : null;
