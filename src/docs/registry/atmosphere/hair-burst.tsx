import * as React from "react";
import { HairBurst } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { ThemaIcon } from "@/icons";
import { defineEntry, definePlayground } from "../types";
import { Stage } from "./fixtures";

/** La demo suelta el pelo con un botón: cada clic cambia la `key` y vuelve a caer. */
function BurstDemo({ density = 10 }: { density?: number }) {
  const [shot, setShot] = React.useState(0);
  return (
    <Stage className="min-h-[320px]">
      {shot > 0 && <HairBurst key={`${shot}-${density}`} density={density} />}
      <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-3 p-section text-center">
        <Heading level={3}>¡Listo, tu cita quedó agendada!</Heading>
        <Text tone="secondary">Cae una vez y se apaga sola.</Text>
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
    "Pelo de barba que cae para celebrar: como el confeti, pero con los pelos finos que quedan tras un arreglo de barba, largos, con una curva suave y afinándose hacia la punta, en negros, castaños y alguna cana. Cae desde arriba del contenedor y a todo su ancho: se van soltando escalonados, cada uno con su peso, y una brisa los lleva de lado. Se apaga en unos 4,5 s. Es la celebración de la cita recién creada en la reserva en línea. Con prefers-reduced-motion no se monta.",
  importPath: 'import { HairBurst } from "@/components/atmosphere"',
  sourcePath: "src/components/atmosphere/HairBurst.tsx",
  status: "stable",
  tags: ["canvas", "celebración", "confeti", "barbería", "reduced-motion"],
  playground: definePlayground({
    controls: {
      density: { type: "number", label: "Densidad", default: 10, min: 2, max: 30, step: 1 },
    },
    layout: "stretch",
    render: ({ density }) => <BurstDemo density={density} />,
    code: ({ density }) => `<section className="relative overflow-hidden">
  {celebrating && <HairBurst key={reservation.id}${density === 10 ? "" : ` density={${density}}`} onDone={() => setCelebrating(false)} />}
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
    { name: "density", type: "number", default: "10", description: "Pelos por cada 100 px de ancho: unos 37 en un celular y unos 120 en un monitor, entre 14 y 300." },
    { name: "onDone", type: "() => void", description: "Al terminar la caída; con «reducir movimiento», enseguida." },
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
