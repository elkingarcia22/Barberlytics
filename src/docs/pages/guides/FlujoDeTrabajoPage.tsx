import { CodeBlock } from "../../components/CodeBlock";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { RuleCard, Step } from "./GuideBits";
import { GitBranch, Link2, Moon, ShieldCheck } from "lucide-react";

const PAGE_CODE = `// src/features/encuestas/EncuestasPage.tsx
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout";
import { PageHeader } from "@/components/utility";
import { QueryBoundary } from "@/lib/query";
import { useEncuestas } from "./queries";

export function EncuestasPage() {
  const query = useEncuestas();
  return (
    <PageShell maxWidth="normal">
      <PageHeader
        title="Encuestas"
        description="Crea encuestas y revisa sus respuestas."
        actions={<Button>Crear encuesta</Button>}
      />
      <QueryBoundary query={query}>
        {(encuestas) => /* la pantalla con piezas del sistema */ null}
      </QueryBoundary>
    </PageShell>
  );
}`;

const DATA_CODE = `// src/features/encuestas/types.ts — el contrato, validado con Zod
export const encuestaSchema = z.object({ id: z.string(), titulo: z.string(), estado: z.enum(["borrador", "activa", "cerrada"]) });
export type Encuesta = z.infer<typeof encuestaSchema>;

// src/features/encuestas/api.ts — una función por endpoint, sobre el cliente tipado
export const listEncuestas = () => apiClient.get("/encuestas", paginatedSchema(encuestaSchema));

// src/features/encuestas/queries.ts — TanStack Query; nada de estado duplicado
export const useEncuestas = () => useQuery({ queryKey: ["encuestas"], queryFn: listEncuestas });

// src/mocks/handlers.ts — el backend simulado responde lo mismo que pide API_CONTRACT.md`;

const ROUTE_CODE = `// src/app/lazyPages.ts
export const EncuestasPage = React.lazy(() => import("@/features/encuestas/EncuestasPage").then((m) => ({ default: m.EncuestasPage })));

// src/app/router.tsx, dentro de los hijos de AppLayout
{ path: "encuestas", element: lazy(<EncuestasPage />) },`;

const NAV_CODE = `// src/app/navigation.ts, en el grupo que corresponda
{ kind: "item", id: "encuestas", label: "Encuestas", icon: ClipboardList, path: "/encuestas" },`;

const CHECK_CODE = `npm run check     # reglas del sistema: librerías, colores, iconos, archivos protegidos
npm run verify    # lint + tipos + pruebas + build
npm run e2e       # recorridos críticos (Playwright)`;

/**
 * La receta de una pantalla nueva en esta app: del archivo al enlace. Con la
 * IA basta con pedirle la pantalla; ella sigue estos mismos pasos.
 */
export function FlujoDeTrabajoPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Empezar"
        title="Flujo de trabajo"
        description="Cómo se suma una pantalla nueva a la aplicación, del archivo al enlace publicado. El ejemplo arma «Encuestas». Con la IA basta con pedirle la pantalla: sigue esta misma receta."
      />

      <DocSection id="pasos" title="Una pantalla nueva" description="Los pasos van en este orden. Cada uno toca un solo lugar.">
        <ol className="max-w-3xl">
          <Step number={1} title="Crear la pantalla en su dominio">
            <p>
              Cada dominio vive en <code>src/features/&lt;dominio&gt;/</code> y exporta su página. <code>PageShell</code> pone el ancho (720, 1140 o 1600px) y <code>PageHeader</code> el título, la descripción y las acciones: no se vuelven a armar.
            </p>
            <CodeBlock code={PAGE_CODE} language="tsx" />
          </Step>
          <Step number={2} title="Definir los datos">
            <p>
              Tipos con Zod, una función por endpoint sobre el cliente tipado y un hook de TanStack Query. El backend simulado en <code>src/mocks/</code> responde lo que pide <code>docs/API_CONTRACT.md</code>, así la pantalla funciona antes de que exista el servicio real.
            </p>
            <CodeBlock code={DATA_CODE} language="ts" />
          </Step>
          <Step number={3} title="Registrar la ruta">
            <p>En diferido, para que el primer render solo traiga el shell.</p>
            <CodeBlock code={ROUTE_CODE} language="tsx" />
          </Step>
          <Step number={4} title="Sumarla al menú">
            <p>Solo si debe aparecer en la barra lateral. Es el único archivo del marco que se toca sin hablar con ingeniería.</p>
            <CodeBlock code={NAV_CODE} language="ts" />
          </Step>
          <Step number={5} title="Maquetar con el sistema">
            <p>
              Parte de un patrón que ya funciona (<a className="text-primary hover:underline" href="#/guides/estados">Estados</a>, <a className="text-primary hover:underline" href="#/guides/formularios">Formularios</a>, <a className="text-primary hover:underline" href="#/guides/ventanas">Modales y drawers</a>) y usa las piezas del catálogo tal como vienen. El home de la app (<code>features/dashboard</code>) es la plantilla de una pantalla de gestión completa.
            </p>
          </Step>
          <Step number={6} title="Validar y compilar">
            <p>La validación revisa librerías, colores, iconos y archivos protegidos; la compilación, que todo encaje. Todo en verde antes de entregar.</p>
            <CodeBlock code={CHECK_CODE} language="bash" />
          </Step>
        </ol>
      </DocSection>

      <DocSection id="entrega" title="Cómo se entrega">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RuleCard icon={Link2} title="Se entrega con enlace">
            Se revisa en la versión publicada, no por pantalla compartida. Nada se da por listo sin enlace.
          </RuleCard>
          <RuleCard icon={GitBranch} title="Una rama por cambio">
            Conventional commits (<code>feat:</code>, <code>fix:</code>…) y PR con resumen y plan de pruebas. La CI corre lint, tipos, pruebas, build y e2e.
          </RuleCard>
          <RuleCard icon={ShieldCheck} title="Lo protegido lo aprueba ingeniería">
            Tokens, temas, shell, configuración y scripts. <code>npm run check</code> avisa si un cambio los toca.
          </RuleCard>
          <RuleCard icon={Moon} title="Probar en claro, oscuro y angosto">
            Si se usan piezas y clases del tema, casi siempre sale solo. Revísalo igual antes de entregar.
          </RuleCard>
        </div>
      </DocSection>
    </div>
  );
}
