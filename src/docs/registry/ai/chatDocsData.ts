import type { ChatMessage, Conversation } from "@/lib/chat";

const now = Date.now();
const message = (partial: Partial<ChatMessage> & Pick<ChatMessage, "id" | "role" | "text">): ChatMessage => ({ createdAt: now, status: "done", ...partial });

/** Una conversación ya andada, con todo lo que una respuesta puede traer. */
export const SEED_CONVERSATION: Conversation = {
  id: "seed",
  title: "Participación de Ventas Bogotá",
  createdAt: now - 60_000,
  updatedAt: now,
  unread: false,
  messages: [
    message({ id: "u1", role: "user", text: "Dime cómo va la participación de Ventas Bogotá este mes y qué debería hacer." }),
    message({
      id: "a1",
      role: "agent",
      text: "Ventas Bogotá está en **58 % de participación**, nueve puntos por debajo del promedio de la empresa. La caída está concentrada en el turno de la tarde.",
      via: "demo",
      sources: [
        { label: "Participación · septiembre", detail: "Aprendizaje › Reportes" },
        { label: "Equipo Ventas Bogotá", detail: "32 personas" },
      ],
      card: {
        kind: "bars",
        title: "Participación por turno",
        rows: [
          { label: "Mañana", value: 71 },
          { label: "Tarde", value: 46 },
          { label: "Noche", value: 58 },
        ],
      },
      followups: ["Preparar un aviso para el turno tarde", "Comparar con el mes pasado", "¿Quiénes no han entrado?"],
    }),
  ],
};

export const SEED_HISTORY: readonly Conversation[] = [
  SEED_CONVERSATION,
  { id: "h2", title: "Evaluaciones pendientes por equipo", createdAt: now - 3 * 3600_000, updatedAt: now - 3 * 3600_000, unread: true, messages: [message({ id: "h2u", role: "user", text: "Evaluaciones pendientes por equipo" }), message({ id: "h2a", role: "agent", text: "Hay 14 vencidas." })] },
  { id: "h3", title: "Resumen encuesta de clima laboral", createdAt: now - 26 * 3600_000, updatedAt: now - 26 * 3600_000, unread: false, messages: [message({ id: "h3u", role: "user", text: "Resumen encuesta de clima laboral" }), message({ id: "h3a", role: "agent", text: "El clima subió 4 puntos." })] },
  { id: "h4", title: "Riesgo de rotación Q3", createdAt: now - 4 * 86_400_000, updatedAt: now - 4 * 86_400_000, unread: false, messages: [message({ id: "h4u", role: "user", text: "Riesgo de rotación Q3" }), message({ id: "h4a", role: "agent", text: "Seis personas con señales." })] },
];
