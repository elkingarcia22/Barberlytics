# Breadcrumbs

El rastro de dónde está la persona dentro de una jerarquía, con el último tramo resaltado como página actual. Cada tramo es un texto o un { label, onClick } cuando lleva a algún sitio; el componente se encarga del separador y del contraste entre niveles.

Familia: Navegación · Doc: `/docs#/components/breadcrumbs` · Fuente: `src/components/navigation/Breadcrumbs.tsx`

```ts
import { Breadcrumbs } from "@/components/navigation"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `items` | `(string \| { label: string; onClick?: () => void })[]` |  | Cada nivel, de la raíz a la página actual. Un string es solo contexto; con `onClick` el tramo navega. El último elemento nunca es clicable, aunque traiga `onClick`. |
| `className` | `string` |  | Clases extra para el <nav>. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Cualquier atributo nativo; el `aria-label` ya viene puesto. |

## Guías

- Sí: Úsalo a partir de dos niveles de profundidad; con uno solo no aporta nada.
- Sí: Mantén las etiquetas cortas y en el mismo orden que la jerarquía real.
- Sí: Colócalo encima del título de la página, nunca dentro del contenido.
- Sí: Pon `onClick` en todo tramo que tenga página propia; déjalo como texto solo cuando de verdad no la tiene (una categoría, un grupo sin pantalla).
- No: No lo uses como sustituto de la sub-navegación: no cambia de sección, solo ubica.
- No: No superes cinco niveles; a partir de ahí colapsa los intermedios.

Relacionados: thema-product-header, page-header, header

## Ejemplos

### Básico

Tres niveles: el último se pinta como texto primario y sin separador.

```tsx
<Breadcrumbs items={["Empresa", "Usuarios", "Elena Martínez"]} />
```

### Con navegación

Un tramo con `onClick` se vuelve clicable; sin él, se queda como contexto sin destino propio.

```tsx
<Breadcrumbs
  items={[
    { label: "Empresa", onClick: () => navigate("/empresa") },
    { label: "Usuarios", onClick: () => navigate("/empresa/usuarios") },
    "Elena Martínez",
  ]}
/>
```

### Navegación controlada

El rastro crece al entrar en una carpeta y se recorta con «Volver». El componente solo recibe la lista.

```tsx
const [path, setPath] = React.useState(["Aprendizaje"]);

<Breadcrumbs items={path} />
<Button variant="ghost" size="xs" onClick={() => setPath((p) => p.slice(0, -1))}>
  <ArrowLeft /> Volver
</Button>
<button onClick={() => setPath((p) => [...p, "Catálogo"])}>Catálogo</button>
```

### Sobre un encabezado de página

Va justo encima del título, en el mismo bloque, para no competir con él.

```tsx
<header className="space-y-1">
  <Breadcrumbs items={["Desempeño", "Evaluaciones 360", "Ciclo 2026-Q1"]} />
  <h1 className="text-xl font-bold text-text-primary">Ciclo 2026-Q1</h1>
</header>
```
