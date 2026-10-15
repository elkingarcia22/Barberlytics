import { CoverHero, CoverTitle } from "@/components/layout";
import { Text } from "@/components/typography";
import { defineEntry, definePlayground } from "../types";

const PHOTO = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=60";

function Demo({ wide, withImage }: { wide: boolean; withImage: boolean }) {
  return (
    <div className="h-[28rem] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background">
      <CoverHero imageUrl={withImage ? PHOTO : null} wide={wide} columnClassName="max-w-md">
        <CoverTitle title="Arma tu cita" lead="Elige sede, servicio y barbero; luego, tu hora." wide={wide} />
        <div className="rounded-xl border border-border bg-surface p-4">
          <Text size="sm" tone="secondary">
            Lo que sigue va en la columna, sobre la foto.
          </Text>
        </div>
      </CoverHero>
    </div>
  );
}

export const coverHeroEntry = defineEntry({
  id: "cover-hero",
  name: "CoverHero",
  group: "layout",
  description:
    "La portada de una pantalla: la foto arriba, encuadrada donde está la cara y fundida hacia abajo, con la columna del contenido montada sobre ella, y CoverTitle para el título encima. En claro la foto va entera y algo más clara y el título en vidrio ahumado; en oscuro un velo la cubre. Es el arranque de los pasos de elegir de la reserva en línea.",
  importPath: 'import { CoverHero, CoverTitle } from "@/components/layout"',
  sourcePath: "src/components/layout/CoverHero.tsx",
  status: "stable",
  tags: ["hero", "cover", "photo", "booking"],
  playground: definePlayground({
    controls: {
      wide: { type: "boolean", label: "Ancha", default: false },
      withImage: { type: "boolean", label: "Con foto", default: true },
    },
    render: ({ wide, withImage }) => <Demo wide={wide} withImage={withImage} />,
    code: ({ wide, withImage }) => `<CoverHero${withImage ? ' imageUrl={shop.coverUrl}' : ""}${wide ? " wide" : ""} columnClassName="max-w-md">
  <CoverTitle title="Arma tu cita" lead="Elige sede, servicio y barbero; luego, tu hora."${wide ? " wide" : ""} />
  …
</CoverHero>`,
  }),
  examples: [
    {
      id: "no-image",
      title: "Sin foto",
      description: "Sin `imageUrl` solo queda el espacio: el contenido no salta cuando la foto tarda.",
      layout: "start",
      code: `<CoverHero columnClassName="max-w-md"><CoverTitle title="Elige tus servicios" /></CoverHero>`,
      render: () => <Demo wide={false} withImage={false} />,
    },
  ],
  props: [
    { name: "imageUrl", type: "string | null", description: "La foto de fondo." },
    { name: "wide", type: "boolean", default: "false", description: "Más alta, para pantallas anchas." },
    { name: "columnClassName", type: "string", description: "El ancho de la columna (lo pone el marco: `max-w-…`)." },
    { name: "title / lead / aside", type: "CoverTitle", description: "CoverTitle: el título en vidrio, su bajada y lo que va a la derecha." },
  ],
  guidelines: {
    do: ["Úsala una vez por pantalla, arriba de todo.", "Pon el título con CoverTitle: sobre la foto el texto normal no contrasta."],
    dont: ["No la uses en pantallas de datos: es para pasos de elegir con imagen de marca.", "No pongas una foto con texto o logos: el título ya va encima."],
  },
  related: ["page-shell", "header"],
});
