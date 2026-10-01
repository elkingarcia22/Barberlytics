# PageShell

El `<main>` de una página: hace scroll por su cuenta, pone el padding de página y centra el contenido en una columna con ancho máximo. Tres anchos según la densidad de la pantalla: enterprise para tablas y dashboards, constrained para lectura y formularios, full para lienzos.

Familia: Layout y shell · Doc: `/docs#/components/page-shell` · Fuente: `src/components/layout/PageShell.tsx`

```ts
import { PageShell } from "@/components/layout"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `maxWidth` | `"enterprise" \| "constrained" \| "full"` | `"enterprise"` | Ancho máximo de la columna: 1600px, 1200px o sin límite. |
| `children` | `React.ReactNode` |  | Las secciones de la página; se apilan con `space-y-8`. |
| `className` | `string` |  | Se mezcla con el `<main>` (`flex-1 overflow-y-auto bg-background p-8`). |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos nativos del `<main>`. Reenvía `ref`. |

## Guías

- Sí: Usa `enterprise` para tablas anchas y dashboards; `constrained` cuando el contenido se lee de arriba abajo.
- Sí: Encabeza la página con PageHeader como primera sección.
- Sí: Deja que PageShell sea el único elemento con scroll vertical de la vista.
- No: No pongas otro `<main>` dentro; ya lo es.
- No: No sobrescribas el padding por sección: es el ritmo de página compartido.

Relacionados: admin-shell, page-header, section-header

## Ejemplos

### Los tres anchos

El contenido se centra con `mx-auto` y las secciones se separan con `space-y-8`. El límite solo se nota cuando el viewport es más ancho que la columna.

```tsx
<PageShell>…</PageShell>                       // max-w-[1600px]
<PageShell maxWidth="constrained">…</PageShell> // max-w-[1200px]
<PageShell maxWidth="full">…</PageShell>        // max-w-full
```

### Dentro del shell de administración

Es el hijo natural del viewport del shell: `flex-1` toma el alto que sobra y el scroll queda dentro de la página.

```tsx
<AdminShell config={config}>
  <PageShell maxWidth="constrained">{children}</PageShell>
</AdminShell>
```
