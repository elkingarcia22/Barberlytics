import { both, titled, type LegalDoc } from "./types";

/**
 * Los subencargados: los proveedores que tratan datos para dar el servicio. Sale de lo que usa el
 * producto hoy (api/, server/ y la configuración de despliegue); lo que aún no está elegido se dice.
 */
export const SUBPROCESSORS: LegalDoc = {
  id: "subprocessors",
  slug: "subencargados",
  version: "subprocessors-2026-10",
  updatedAt: "2026-10-19",
  title: titled("Subencargados", "Subprocessors"),
  summary: titled(
    "Los proveedores que tratan datos para dar el servicio: qué hace cada uno, qué datos ve y dónde.",
    "The providers that process data to deliver the service: what each does, what data it sees and where."
  ),
  audience: titled("Barberías que usan Barberlytics y sus clientes.", "Shops using Barberlytics and their clients."),
  sections: [
    {
      id: "lista",
      title: titled("Proveedores", "Providers"),
      body: both(
        [
          "- Vercel Inc. (EE. UU.): aloja la aplicación y sus funciones de servidor. Ve todo lo que pasa por el servicio, cifrado en tránsito.",
          "- Upstash Inc. (EE. UU.): guarda la cola de mensajes de WhatsApp (celular, tipo de mensaje y sus valores) y las respuestas de los clientes, hasta 60 días.",
          "- Meta Platforms (WhatsApp Business Cloud API, EE. UU.): envía los mensajes de las citas y recibe las respuestas. La cuenta de WhatsApp Business es de cada barbería.",
          "- Anthropic PBC (EE. UU.): el modelo de Clipper y de las narraciones («Cómo te fue», «¿Por qué esta cifra?»). Recibe preguntas y resultados de consultas, sin teléfonos ni notas de salud; por la API comercial, sin entrenar con esos datos.",
          "- Proveedor de voz de Clipper (EE. UU.), el que se configure: ElevenLabs Inc., Microsoft Azure Speech u OpenAI. Recibe el texto que Clipper dice en voz alta. Siempre con plan pago [por confirmar cuál].",
          "- Google LLC (EE. UU.): hojas de cálculo y carpetas de las campañas de opinión y de los comentarios de revisión, cuando la barbería las usa.",
          "- Base de datos, correo transaccional y registro de errores: [proveedores por elegir, p. ej. Supabase, Resend y Sentry]; se agregan aquí con 30 días de aviso antes de usarlos.",
        ],
        [
          "- Vercel Inc. (U.S.): hosts the application and its server functions. Sees everything going through the service, encrypted in transit.",
          "- Upstash Inc. (U.S.): stores the WhatsApp message queue (phone, message type and values) and client replies, up to 60 days.",
          "- Meta Platforms (WhatsApp Business Cloud API, U.S.): sends appointment messages and receives replies. The WhatsApp Business account belongs to each shop.",
          "- Anthropic PBC (U.S.): the model behind Clipper and narratives (“How did it go”, “Why this figure?”). Receives questions and lookup results, without phone numbers or health notes; through the commercial API, without training on that data.",
          "- Clipper's voice provider (U.S.), whichever is configured: ElevenLabs Inc., Microsoft Azure Speech or OpenAI. Receives the text Clipper speaks aloud. Always on a paid plan [to be confirmed which].",
          "- Google LLC (U.S.): spreadsheets and folders for feedback campaigns and review comments, when the shop uses them.",
          "- Database, transactional email and error logging: [providers to be chosen, e.g. Supabase, Resend and Sentry]; added here with 30 days' notice before use.",
        ]
      ),
    },
    {
      id: "pasarelas",
      title: titled("Pasarelas de pago", "Payment gateways"),
      body: both(
        ["Stripe, Square, Wompi, Bold o Mercado Pago, la que conecte cada barbería. Reciben la tarjeta directamente en sus propios campos; Barberlytics solo recibe el token, la marca y los últimos 4 dígitos. Cada barbería tiene su propio contrato con su pasarela."],
        ["Stripe, Square, Wompi, Bold or Mercado Pago, whichever each shop connects. They receive the card directly in their own fields; Barberlytics only receives the token, brand and last 4 digits. Each shop has its own contract with its gateway."]
      ),
    },
    {
      id: "cambios",
      title: titled("Cambios", "Changes"),
      body: both(
        ["Avisamos con 30 días antes de sumar o cambiar un subencargado (ver el Acuerdo de encargo de datos)."],
        ["We give 30 days' notice before adding or changing a subprocessor (see the Data processing agreement)."]
      ),
    },
  ],
};
