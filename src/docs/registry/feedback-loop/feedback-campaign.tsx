import * as React from "react";
import { Button } from "@/components/ui/button";
import { FeedbackCampaign, FEEDBACK_LAUNCHER_TARGET, campaignKey, type FeedbackCampaignConfig } from "@/components/feedback-loop";
import { defineEntry } from "../types";

const DEMO: FeedbackCampaignConfig = {
  id: "demo-doc",
  name: "Demo de la documentación",
  sections: [
    { value: "general", label: "Impresión general" },
    { value: "falta", label: "Algo que falta" },
  ],
  tour: [
    { id: "hola", icon: "rocket", title: "Lanzamos algo nuevo", description: "Recórrelo y dinos qué cambiarías." },
    { id: "boton", icon: "feedback", target: FEEDBACK_LAUNCHER_TARGET, title: "Tu opinión, aquí", description: "Este botón te acompaña en todas las páginas." },
  ],
};

function CampaignDemo() {
  const [mounted, setMounted] = React.useState(false);
  const reset = () => {
    try {
      window.localStorage.removeItem(campaignKey(DEMO.id, "tour"));
      window.localStorage.removeItem(campaignKey(DEMO.id, "opened"));
    } catch {
      /* sin almacenamiento no hay nada que borrar */
    }
    setMounted(false);
    window.setTimeout(() => setMounted(true), 0);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => setMounted((value) => !value)} variant={mounted ? "outline" : "default"}>
        {mounted ? "Quitar la campaña" : "Montar la campaña"}
      </Button>
      <Button variant="ghost" onClick={reset}>
        Empezar como nuevo
      </Button>
      {mounted && <FeedbackCampaign campaign={DEMO} context="Documentación" onSubmit={() => new Promise((resolve) => window.setTimeout(resolve, 600))} />}
    </div>
  );
}

export const feedbackCampaignEntry = defineEntry({
  id: "feedback-campaign",
  name: "FeedbackCampaign",
  group: "feedback-loop",
  description:
    "El circuito completo para pedir feedback masivo sobre algo recién lanzado: recorrido guiado la primera vez, botón flotante en todas las páginas y panel de comentarios. Recuerda por campaña —en el navegador— si ya se vio el recorrido y si ya se abrió el panel; una campaña con otro `id` empieza de cero. En la app lo monta `FeedbackHost` (src/features/feedback), que añade página, campaña y persona y lo envía a `POST /feedback`, donde una función de Vercel lo guarda en la hoja de Google de la campaña y un cron semanal lo resume con Claude (docs/FEEDBACK_LOOP.md).",
  importPath: 'import { FeedbackCampaign, type FeedbackCampaignConfig } from "@/components/feedback-loop"',
  sourcePath: "src/components/feedback-loop/FeedbackCampaign.tsx",
  status: "beta",
  tags: ["feedback", "campaña", "onboarding", "composición"],
  examples: [
    {
      id: "live",
      title: "Campaña montada",
      description: "Al montarla sale el recorrido y el botón aparece en la esquina de la ventana (es fijo, no vive en este marco).",
      code: `const campana: FeedbackCampaignConfig = {
  id: "rediseno-2026-09",
  name: "Rediseño",
  sections: [{ value: "general", label: "Impresión general" }],
  tour: [
    { id: "hola", icon: "rocket", title: "Lanzamos algo nuevo", description: "…" },
    { id: "boton", icon: "feedback", target: FEEDBACK_LAUNCHER_TARGET, title: "Tu opinión, aquí", description: "…" },
  ],
}

<FeedbackCampaign campaign={campana} context="Métricas" onSubmit={enviar} />`,
      render: () => <CampaignDemo />,
    },
  ],
  props: [
    { name: "campaign", type: "FeedbackCampaignConfig", description: "`{ id, name, sections, tour? }`. El `id` separa respuestas y memoria." },
    { name: "context", type: "string", description: "La página actual; se enseña en el panel." },
    { name: "onSubmit", type: "(values) => Promise<void> | void", description: "Recibe sección y comentario; quien monta añade lo demás." },
    { name: "autoStartTour", type: "boolean", default: "true", description: "Lanza el recorrido la primera vez." },
    { name: "tourDelayMs", type: "number", default: "700", description: "Espera antes del recorrido, para que la pantalla termine de pintarse." },
    { name: "startTourRef", type: "Ref<(() => void) | null>", description: "Recibe una función para relanzar el recorrido desde otro sitio." },
  ],
  guidelines: {
    do: ["Cambia el `id` al lanzar otra cosa: así todos ven el nuevo recorrido.", "Apunta el último paso al botón con `FEEDBACK_LAUNCHER_TARGET`."],
    dont: ["No montes dos campañas a la vez: habría dos botones en la misma esquina."],
  },
  related: ["guided-tour", "feedback-launcher", "feedback-panel"],
});
