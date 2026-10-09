import { ClipperOrb } from "@/components/ai-interaction";
import { defineEntry, definePlayground } from "../types";

export const clipperOrbEntry = defineEntry({
  id: "clipper-orb",
  name: "ClipperOrb",
  group: "ai",
  description:
    "El símbolo de la IA en todo el sistema: el orbe de Clipper, un poste de barbería hecho esfera de vidrio con el gradiente de IA. Gira, respira y late según lo que hace el agente. Es lo que dibuja `ThemaIcon name=\"sparkles\"`, `AiSparkGlyph`, `ChatMark` y la portada de Clipper.",
  importPath: 'import { ClipperOrb } from "@/components/ai-interaction"',
  sourcePath: "src/components/ai-interaction/ClipperOrb.tsx",
  status: "stable",
  tags: ["ia", "marca", "clipper", "animación"],
  playground: definePlayground({
    controls: {
      size: { type: "number", label: "Tamaño (px)", default: 128, min: 14, max: 220, step: 2 },
      state: { type: "select", label: "Estado", default: "idle", options: ["idle", "listening", "thinking"] },
      bare: { type: "boolean", label: "Sin halo ni anillo", default: false },
    },
    render: ({ size, state, bare }) => (
      <div className="flex min-h-56 items-center justify-center p-8">
        <ClipperOrb size={size} state={state as "idle" | "listening" | "thinking"} bare={bare} />
      </div>
    ),
    code: ({ size, state, bare }) => `<ClipperOrb size={${size}}${state !== "idle" ? ` state="${state}"` : ""}${bare ? " bare" : ""} />`,
  }),
  examples: [
    {
      id: "states",
      title: "Estados",
      description: "En reposo gira despacio; escuchando, rápido y late; pensando, el halo se aviva.",
      code: `<ClipperOrb size={96} />
<ClipperOrb size={96} state="listening" />
<ClipperOrb size={96} state="thinking" />`,
      render: () => (
        <div className="flex items-center gap-10 p-6">
          <ClipperOrb size={96} />
          <ClipperOrb size={96} state="listening" />
          <ClipperOrb size={96} state="thinking" />
        </div>
      ),
    },
    {
      id: "small",
      title: "Pequeño, junto a un texto",
      description: "Hasta unos 32 px va `bare`: sin halo ni anillo, para no ensuciar el texto.",
      code: `<ClipperOrb size={16} bare />
<ClipperOrb size={24} bare />`,
      render: () => (
        <div className="flex items-center gap-4">
          <ClipperOrb size={16} bare />
          <ClipperOrb size={24} bare />
          <span className="text-sm font-semibold text-ai-gradient">Clipper</span>
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: "number", default: "128", description: "Lado en px. Pequeño (14–24) acompaña a un texto; grande (120+) es la portada." },
    { name: "state", type: '"idle" | "listening" | "thinking"', default: '"idle"', description: "Lo que hace Clipper: reposo, escuchando (gira rápido y late) o pensando (el halo se aviva)." },
    { name: "bare", type: "boolean", default: "false", description: "Sin halo ni anillo, para tamaños pequeños." },
  ],
  guidelines: {
    do: ["Úsalo siempre que haya que mostrar «la IA»: botones, cargas, mensajes del agente, estados vacíos de IA.", "Usa `state` para reflejar lo que hace Clipper (escucha, piensa)."],
    dont: ["No dibujes otro destello o icono de IA: pide el orbe (`ThemaIcon name=\"sparkles\"` ya lo es).", "No lo uses como decoración en superficies que no son de IA: es la marca del agente."],
  },
  related: ["ai-spark-glyph", "ai-button", "thema-icon", "ai-analyzing-state"],
});
