# GlobalSearch

La búsqueda general del producto: un solo campo para abrir un registro, ir a una pantalla o preguntar al agente. Quien la monta le pasa el índice —sus registros y su árbol de navegación— y el componente se encarga del filtrado sin tildes, de las pestañas de alcance, del recuento y de los atajos. En el shell ya viene puesta en la cabecera y se abre con ⌘K.

Familia: Navegación · Doc: `/docs#/components/global-search` · Fuente: `src/components/search/GlobalSearch.tsx`

```ts
import { GlobalSearch } from "@/components/search"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `objects` | `SearchObjectItem[]` |  | Registros del producto. Cada uno con `title`, `meta` visible, `keywords` invisibles y su `onSelect`. |
| `navigate` | `SearchNavigateItem[]` |  | Destinos. `path` es la ruta legible completa: se pinta como migas y se busca por cualquier tramo. |
| `onAsk` | `(question: string) => void` |  | Habilita preguntar al agente con lo escrito. Sin esto no hay grupo de preguntas. |
| `askHint` | `string` |  | Una línea que explica dónde responde la pregunta. |
| `askSuggestions` | `string[]` |  | Preguntas que se ofrecen antes de escribir (hasta dos). Pásale las de la pantalla en la que se está. |
| `actions` | `SearchActionItem[]` |  | Acciones que se ofrecen siempre. Las de la pantalla abierta no hace falta pasarlas: llegan solas desde su barra de acciones (`usePublishSearchActions`). |
| `contextLabel` | `string` |  | El nombre de la pantalla actual; rotula el grupo «Acciones rápidas · Calendario». |
| `recentsKey` | `string \| null` | `"thema.search.recents"` | Dónde se recuerdan en el navegador los últimos resultados abiertos. `null` para no recordarlos. |
| `scope` | `string` |  | Sobre qué se busca; se muestra en la barra inferior como «Alcance». |
| `placeholder` | `string` | `"Buscar o preguntar"` | Texto del campo. |
| `triggerLabel` | `string` |  | Texto del disparador en la cabecera; por defecto, el del campo. |
| `mark` | `React.ReactNode` |  | Glifo del campo. Por defecto la chispa de IA si se puede preguntar, y la lupa si no. |

## Guías

- Sí: Con el campo vacío deja que hable el contexto: acciones de la pantalla, una pregunta sobre ella y lo último abierto. El índice entero llega al escribir.
- Sí: Deja que el shell la monte: así el atajo ⌘K y su sitio en la cabecera son los mismos en todo el producto.
- Sí: Pon en `meta` lo que distingue a dos registros con el mismo nombre: tipo, estado, cifras.
- Sí: Usa `keywords` para alias y jerga que la gente escribe pero que no quieres pintar en la fila.
- Sí: Pasa `scope` cuando la búsqueda no abarque todo: la empresa, el espacio o el proyecto activo.
- No: No la uses para filtrar una tabla o una lista de una pantalla: para eso está su propio campo de búsqueda.
- No: No pases `onAsk` si no hay un agente que responda; la fila de preguntas prometería algo que no ocurre.
- No: No metas cientos de objetos sin filtrar en el cliente: por encima de unos pocos cientos, filtra en el servidor y pasa el resultado.

Relacionados: thema-product-header, admin-shell, command

## Ejemplos

### El índice

Dos listas y sus acciones. Los objetos se buscan por título, por su contexto y por palabras clave que no se pintan; los destinos, por cualquier tramo de su ruta.

```tsx
const objects = [
  { id: "vac", title: "Analista de datos", meta: ["vacante", "Entrevistas", "12 candidatos"], onSelect: abrirVacante },
  { id: "cand", title: "Andrés Malo", meta: ["candidato", "Analista de datos"], onSelect: abrirPersona },
];

const navigate = [
  { id: "vacantes", path: ["Selección", "Vacantes"], onSelect: () => navigate("/seleccion/vacantes") },
];
```

### Sin agente

Sin `onAsk` desaparecen la pestaña y el grupo de preguntas, y la marca del campo pasa del gradiente de IA al de marca: la búsqueda no promete algo que no puede hacer. Es como la monta la documentación.

```tsx
<GlobalSearch
  objects={componentes}
  navigate={fundamentos}
  placeholder="Busca un componente o un fundamento"
  scope="Sistema de diseño · v0.1"
/>
```

### En el shell

`AdminShell` ya la pone en la cabecera con los registros de demostración y los destinos derivados de su árbol de navegación, y preguntar abre el panel del agente. Para cambiar el índice se pasa `search` en su configuración; `chrome.search: false` la quita.

```tsx
<AdminShell
  config={{
    search: {
      objects: misRegistros,
      scope: empresaActiva.name,
    },
  }}
>
  …
</AdminShell>
```
