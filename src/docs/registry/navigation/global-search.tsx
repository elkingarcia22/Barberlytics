import { GlobalSearch } from "@/components/search";
import { defineEntry, definePlayground } from "../types";

const OBJECTS = [
  { id: "vac", title: "Analista de datos", meta: ["vacante", "Entrevistas", "12 candidatos"], onSelect: () => {} },
  { id: "cand", title: "Andrés Malo", meta: ["candidato", "Analista de datos"], onSelect: () => {} },
  { id: "curso", title: "Onboarding comercial", meta: ["ruta", "48 inscritos"], keywords: ["formación", "ventas"], onSelect: () => {} },
];

const DESTINATIONS = [
  { id: "vacantes", path: ["Selección", "Vacantes"], onSelect: () => {} },
  { id: "plantillas", path: ["Selección", "Plantillas de selección"], onSelect: () => {} },
  { id: "config", path: ["Selección", "Configuración del proceso"], onSelect: () => {} },
  { id: "objetivos", path: ["Desempeño", "Objetivos"], onSelect: () => {} },
];

const INDEX_CODE = `const objects = [
  { id: "vac", title: "Analista de datos", meta: ["vacante", "Entrevistas", "12 candidatos"], onSelect: abrirVacante },
  { id: "cand", title: "Andrés Malo", meta: ["candidato", "Analista de datos"], onSelect: abrirPersona },
];

const navigate = [
  { id: "vacantes", path: ["Selección", "Vacantes"], onSelect: () => navigate("/seleccion/vacantes") },
];`;

export const globalSearchEntry = defineEntry({
  id: "global-search",
  name: "GlobalSearch",
  group: "navigation",
  description:
    "La búsqueda general del producto: un solo campo para abrir un registro, ir a una pantalla o preguntar al agente. Quien la monta le pasa el índice —sus registros y su árbol de navegación— y el componente se encarga del filtrado sin tildes, de las pestañas de alcance, del recuento y de los atajos. En el shell ya viene puesta en la cabecera y se abre con ⌘K.",
  importPath: 'import { GlobalSearch } from "@/components/search"',
  sourcePath: "src/components/search/GlobalSearch.tsx",
  status: "stable",
  tags: ["cmdk", "⌘K", "dialog", "ia"],
  playground: definePlayground({
    controls: {
      ask: { type: "boolean", label: "Preguntar al agente", default: true },
      scope: { type: "text", label: "Alcance", default: "Meta Colombia" },
      triggerLabel: { type: "text", label: "Texto del disparador", default: "Buscar o preguntar" },
    },
    render: ({ ask, scope, triggerLabel }) => (
      <GlobalSearch
        objects={OBJECTS}
        navigate={DESTINATIONS}
        scope={scope || undefined}
        triggerLabel={triggerLabel}
        onAsk={ask ? () => {} : undefined}
        askHint={ask ? "Se responde en el panel del Agente IA" : undefined}
      />
    ),
    code: ({ ask, scope, triggerLabel }) =>
      `<GlobalSearch
  objects={objects}
  navigate={destinations}${scope ? `\n  scope="${scope}"` : ""}
  triggerLabel="${triggerLabel}"${ask ? `\n  onAsk={(pregunta) => agente.preguntar(pregunta)}\n  askHint="Se responde en el panel del Agente IA"` : ""}
/>`,
  }),
  examples: [
    {
      id: "index",
      title: "El índice",
      description:
        "Dos listas y sus acciones. Los objetos se buscan por título, por su contexto y por palabras clave que no se pintan; los destinos, por cualquier tramo de su ruta.",
      code: INDEX_CODE,
      render: () => <GlobalSearch objects={OBJECTS} navigate={DESTINATIONS} triggerLabel="Ver el índice de ejemplo" />,
    },
    {
      id: "sin-agente",
      title: "Sin agente",
      description:
        "Sin `onAsk` desaparecen la pestaña y el grupo de preguntas, y la marca del campo pasa del gradiente de IA al de marca: la búsqueda no promete algo que no puede hacer. Es como la monta la documentación.",
      code: `<GlobalSearch
  objects={componentes}
  navigate={fundamentos}
  placeholder="Busca un componente o un fundamento"
  scope="Sistema de diseño · v0.1"
/>`,
      render: () => (
        <GlobalSearch
          objects={OBJECTS}
          navigate={DESTINATIONS}
          placeholder="Busca un componente o un fundamento"
          scope="Sistema de diseño · v0.1"
          triggerLabel="Buscar en el sistema…"
        />
      ),
    },
    {
      id: "en-el-shell",
      title: "En el shell",
      description:
        "`AdminShell` ya la pone en la cabecera con los registros de demostración y los destinos derivados de su árbol de navegación, y preguntar abre el panel del agente. Para cambiar el índice se pasa `search` en su configuración; `chrome.search: false` la quita.",
      code: `<AdminShell
  config={{
    search: {
      objects: misRegistros,
      scope: empresaActiva.name,
    },
  }}
>
  …
</AdminShell>`,
      render: () => <GlobalSearch objects={OBJECTS} navigate={DESTINATIONS} onAsk={() => {}} askHint="Se responde en el panel del Agente IA" scope="Meta Colombia" />,
    },
  ],
  props: [
    { name: "objects", type: "SearchObjectItem[]", description: "Registros del producto. Cada uno con `title`, `meta` visible, `keywords` invisibles y su `onSelect`." },
    { name: "navigate", type: "SearchNavigateItem[]", description: "Destinos. `path` es la ruta legible completa: se pinta como migas y se busca por cualquier tramo." },
    { name: "onAsk", type: "(question: string) => void", description: "Habilita preguntar al agente con lo escrito. Sin esto no hay grupo de preguntas." },
    { name: "askHint", type: "string", description: "Una línea que explica dónde responde la pregunta." },
    { name: "askSuggestions", type: "string[]", description: "Preguntas que se ofrecen antes de escribir (hasta dos). Pásale las de la pantalla en la que se está." },
    { name: "actions", type: "SearchActionItem[]", description: "Acciones que se ofrecen siempre. Las de la pantalla abierta no hace falta pasarlas: llegan solas desde su barra de acciones (`usePublishSearchActions`)." },
    { name: "contextLabel", type: "string", description: "El nombre de la pantalla actual; rotula el grupo «Acciones rápidas · Calendario»." },
    { name: "recentsKey", type: "string | null", default: '"thema.search.recents"', description: "Dónde se recuerdan en el navegador los últimos resultados abiertos. `null` para no recordarlos." },
    { name: "scope", type: "string", description: "Sobre qué se busca; se muestra en la barra inferior como «Alcance»." },
    { name: "placeholder", type: "string", default: '"Buscar o preguntar"', description: "Texto del campo." },
    { name: "triggerLabel", type: "string", description: "Texto del disparador en la cabecera; por defecto, el del campo." },
    { name: "mark", type: "React.ReactNode", description: "Glifo del campo. Por defecto la chispa de IA si se puede preguntar, y la lupa si no." },
  ],
  guidelines: {
    do: [
      "Con el campo vacío deja que hable el contexto: acciones de la pantalla, una pregunta sobre ella y lo último abierto. El índice entero llega al escribir.",
      "Deja que el shell la monte: así el atajo ⌘K y su sitio en la cabecera son los mismos en todo el producto.",
      "Pon en `meta` lo que distingue a dos registros con el mismo nombre: tipo, estado, cifras.",
      "Usa `keywords` para alias y jerga que la gente escribe pero que no quieres pintar en la fila.",
      "Pasa `scope` cuando la búsqueda no abarque todo: la empresa, el espacio o el proyecto activo.",
    ],
    dont: [
      "No la uses para filtrar una tabla o una lista de una pantalla: para eso está su propio campo de búsqueda.",
      "No pases `onAsk` si no hay un agente que responda; la fila de preguntas prometería algo que no ocurre.",
      "No metas cientos de objetos sin filtrar en el cliente: por encima de unos pocos cientos, filtra en el servidor y pasa el resultado.",
    ],
  },
  related: ["thema-product-header", "admin-shell", "command"],
});
