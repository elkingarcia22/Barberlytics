import * as React from "react";
import { HairBurst } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

/** La demo dispara la ráfaga con un botón: cada clic cambia la `key` y vuelve a estallar. */
function BurstDemo({ count = 160 }: { count?: number }) {
  const [shot, setShot] = React.useState(0);
  return (
    <Stage className="min-h-[320px]">
      {shot > 0 && <HairBurst key={`${shot}-${count}`} count={count} />}
      <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-3 p-section text-center">
        <Heading level={3}>¡Listo, tu cita quedó agendada!</Heading>
        <Text tone="secondary">La ráfaga sale una vez y se apaga sola.</Text>
        <Button type="button" variant="outline" onClick={() => setShot((value) => value + 1)}>
          <ThemaIcon name="sparkles" />
          Disparar
        </Button>
      </div>
    </Stage>
  );
}

export const hairBurstEntry = defineEntry({
  id: "hair-burst",
  name: "HairBurst",
  group: "atmosphere",
  description:
    "Ráfaga de pelo de barba para celebrar: como el confeti, pero con los pelos finos que quedan tras un arreglo de barba, largos, con una curva suave y afinándose hacia la punta, en negros, castaños y alguna cana. Estalla una vez hacia arriba, cae despacio meciéndose y se apaga en unos 4 s. Es la celebración de la cita recién creada en la reserva en línea. Con prefers-reduced-motion no se monta.",
  importPath: 'import { HairBurst } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/HairBurst.tsx",
  status: "stable",
  tags: ["canvas", "celebración", "confeti", "barbería", "reduced-motion"],
  playground: definePlayground({
    controls: {
      count: { type: "number", label: "Pelos", default: 160, min: 40, max: 320, step: 20 },
    },
    layout: "stretch",
    render: ({ count }) => <BurstDemo count={count} />,
    code: ({ count }) => `<section className="relative overflow-hidden">
  {celebrating && <HairBurst key={reservation.id}${count === 160 ? "" : ` count={${count}}`} onDone={() => setCelebrating(false)} />}
  …
</section>`,
  }),
  examples: [
    {
      id: "reserved",
      title: "Cita creada",
      description: "Así sale en la reserva en línea al confirmar la cita: encima de todo (`z-toast`), sin interceptar el puntero, y se desmonta en `onDone`.",
      layout: "stretch",
      code: `<HairBurst key={reservation.id} className="z-toast" onDone={() => setBurstId(null)} />`,
      render: () => <BurstDemo />,
    },
  ],
  props: [
    { name: "count", type: "number", default: "160", description: "Cuántos pelos salen." },
    { name: "origin", type: "{ x: number; y: number }", default: "{ x: 0.5, y: 0.3 }", description: "De dónde estallan, en proporción del contenedor (0 a 1)." },
    { name: "onDone", type: "() => void", description: "Al terminar la ráfaga; con «reducir movimiento», enseguida." },
    { name: "className", type: "string", description: "Clases extra para el <canvas>, que ya es absolute inset-0 y no intercepta el puntero." },
  ],
  guidelines: {
    do: [
      "Úsala para un logro de verdad: la cita creada, no cada paso del recorrido.",
      "Dale como `key` lo que celebra (el id de la reserva): así no se repite al volver a la pantalla.",
      "El contenedor tiene que ser `relative` y con `overflow-hidden`; el canvas mide al padre.",
    ],
    dont: [
      "No la dejes montada en bucle: para lluvia de fondo está HairCanvas.",
      "No la dispares dos veces seguidas en el mismo recorrido.",
      "No le des los colores del tema: son colores de pelo de verdad (más claros sobre fondo oscuro), para que se lea como pelo y no como confeti.",
    ],
  },
  related: ["hair-canvas", "halo"],
});
