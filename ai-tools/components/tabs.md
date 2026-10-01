# Tabs

Pestañas de Radix con un indicador que se desliza entre triggers gracias a `layoutId` de framer-motion. Dos variantes: `view` (por defecto, píldora blanca sobre la pista, texto primario) para cambiar de vista dentro de una sección, y `page` (relleno primario, 40px) para las secciones principales de una página.

Familia: Primitivos · Doc: `/docs#/components/tabs` · Fuente: `src/components/ui/tabs.tsx`

```ts
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / defaultValue` | `string` |  | En `Tabs`. Pestaña activa controlada o inicial. |
| `onValueChange` | `(value: string) => void` |  | En `Tabs`. Se dispara al cambiar de pestaña. |
| `variant` | `"view" \| "page"` | `"view"` | En `TabsList`. Cambia la altura (36/40px), el radio y el estilo del indicador; los triggers lo leen por contexto. |
| `value` | `string` |  | En `TabsTrigger` y `TabsContent`. Debe coincidir entre ambos. |
| `disabled` | `boolean` |  | En `TabsTrigger`. Opacidad al 50% y sin eventos. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | En `Tabs`. Cambia la navegación por teclado; los estilos están pensados para horizontal. |

## Guías

- Sí: Una sola `page` por pantalla; dentro de cada sección usa `view`.
- Sí: Mantén las etiquetas cortas (1–2 palabras) y, si llevan icono, en todas.
- Sí: Renderiza un `TabsContent` por cada trigger, con el mismo `value`.
- No: No uses Tabs para navegar entre rutas: para eso está ThemaTabs / TabsNav.
- No: No anides dos niveles de Tabs con la misma variante.
- No: No pongas más de 5–6 pestañas; agrupa o usa Select.

Relacionados: thema-tabs, tabs-nav, segmented-control

## Ejemplos

### Variante view (por defecto)

Píldora blanca con sombra sobre la pista; el texto activo se pinta en primario. Para alternar vistas dentro de una sección.

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview"><BarChart3 /> Resumen</TabsTrigger>
    <TabsTrigger value="people"><Users /> Personas</TabsTrigger>
    <TabsTrigger value="tasks"><ListChecks /> Acciones</TabsTrigger>
    <TabsTrigger value="settings"><Settings /> Ajustes</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  …
</Tabs>
```

### Variante page

Relleno primario y 40px de alto, a juego con Input y Select. Para las secciones principales de una página.

```tsx
<Tabs defaultValue="overview">
  <TabsList variant="page">
    <TabsTrigger value="overview"><BarChart3 /> Resumen</TabsTrigger>
    <TabsTrigger value="people"><Users /> Personas</TabsTrigger>
    …
  </TabsList>
  …
</Tabs>
```

### Controlado desde fuera

Con `value` y `onValueChange` los botones Anterior/Siguiente mueven el indicador igual que un clic.

```tsx
const [step, setStep] = React.useState("datos");

<Tabs value={step} onValueChange={setStep}>
  <TabsList variant="page">
    <TabsTrigger value="datos">1. Datos</TabsTrigger>
    <TabsTrigger value="preguntas">2. Preguntas</TabsTrigger>
    <TabsTrigger value="envio">3. Envío</TabsTrigger>
  </TabsList>
  …
</Tabs>
<Button onClick={() => setStep("preguntas")}>Siguiente</Button>
```
