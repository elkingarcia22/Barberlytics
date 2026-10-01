# Scrollspy

Índice lateral (o de pestañas) que resalta la sección visible mientras se hace scroll, con `IntersectionObserver` en vez de un handler de scroll. Úsalo en pantallas largas de configuración o en fichas con varias secciones fijas.

Familia: Navegación · Doc: `/docs#/components/scrollspy` · Fuente: `src/components/navigation/Scrollspy.tsx`

```ts
import { Scrollspy, useScrollspy } from "@/components/navigation/Scrollspy"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `sections` | `ScrollspySection[]` |  | `{ id, label, level? }`. `id` debe existir en el DOM dentro de `scrollContainer` (o del documento). `level: 2` indenta la entrada como subsección. |
| `scrollContainer` | `React.RefObject<HTMLElement \| null>` |  | Contenedor con scroll propio. Sin él, se observa contra el viewport. |
| `offset` | `number` | `0` | Píxeles que tapa una cabecera fija sobre el contenedor; desplaza tanto el destino del clic como la banda activa del observador. |
| `title` | `string` |  | Rótulo del índice; también es el `aria-label` del `<nav>` ("En esta página" si no se indica ninguno de los dos). |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Vertical dibuja una lista con filete lateral; horizontal, una barra de pestañas con scroll. |
| `onSectionChange` | `(id: string) => void` |  | Se llama cada vez que cambia la sección activa (mismo evento que dispara el hook). |
| `updateHash` | `boolean` | `true` | Escribe `#id` en la barra de direcciones con `replaceState` al hacer clic. Desactívalo en pantallas con router por hash, donde el hash ya es la ruta. |
| `...props` | `Omit<React.HTMLAttributes<HTMLElement>, "title">` |  | Atributos nativos del `<nav>`. |
| `useScrollspy(ids, options)` | `(ids: readonly string[], options?: UseScrollspyOptions) => UseScrollspyResult` |  | El hook detrás de `Scrollspy`. `options`: `{ scrollContainer?, offset?, onChange? }`. Devuelve `{ activeId, setActiveId }`; reutilízalo para un índice con markup propio. |

## Guías

- Sí: Pasa siempre `scrollContainer` cuando las secciones viven dentro de un panel con su propio scroll; sin él, `Scrollspy` observa el viewport completo.
- Sí: Da a cada sección un `id` estable y usa `scroll-mt-*` (o `offset`) si hay una cabecera fija encima.
- Sí: En pantallas con router por hash, pasa `updateHash={false}` para no pisar la ruta actual.
- No: No lo uses con menos de tres secciones: un enlace «Ver más abajo» resuelve el caso simple.
- No: No dupliques `id`s entre `Scrollspy` y otras anclas de la misma página; el observador solo ve el primero.
- No: No lo reemplaces por un listener de `scroll`: pierdes la eficiencia del `IntersectionObserver` y el efecto es más difícil de igualar.

Relacionados: tabs-nav, breadcrumbs, page-shell, table-shell

## Ejemplos

### Cuatro secciones de una pantalla de configuración

El caso típico: `scrollContainer` apunta al panel con scroll propio (no al viewport), y `updateHash` va en `false` porque la doc ya usa el hash como ruta.

```tsx
const scrollContainer = React.useRef<HTMLDivElement>(null);

<Scrollspy sections={sections} scrollContainer={scrollContainer} title="En esta página" />
<div ref={scrollContainer} className="overflow-auto">
  <section id="general">...</section>
  <section id="notificaciones">...</section>
  <section id="permisos">...</section>
  <section id="integraciones">...</section>
</div>
```

### Ficha de candidato con subsecciones

`level: 2` indenta una entrada como subsección, útil cuando «Experiencia» y «Formación» cuelgan de un bloque más grande.

```tsx
<Scrollspy
  title="Ficha del candidato"
  sections={[
    { id: "perfil", label: "Perfil" },
    { id: "experiencia", label: "Experiencia", level: 2 },
    { id: "formacion", label: "Formación", level: 2 },
    { id: "evaluacion", label: "Evaluación" },
    { id: "referencias", label: "Referencias" },
  ]}
  scrollContainer={scrollContainer}
/>
```

### El hook a mano

`useScrollspy(ids, options)` devuelve `activeId` y `setActiveId`; sirve para construir un índice propio (aquí, botones en vez de enlaces) cuando el `<nav>` de `Scrollspy` no encaja.

```tsx
const ids = sections.map((s) => s.id);
const { activeId, setActiveId } = useScrollspy(ids, { scrollContainer });

<button
  onClick={() => {
    setActiveId(section.id);
    document.getElementById(section.id)?.scrollIntoView({ block: "start" });
  }}
  aria-current={activeId === section.id ? "true" : undefined}
>
  {section.label}
</button>
```
