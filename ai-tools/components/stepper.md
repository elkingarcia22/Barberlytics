# Stepper

Flujo por pasos con círculo numerado, etiqueta y conector. Marca el paso activo con `aria-current="step"` y deriva el estado de cada paso de `current`; un `status` explícito (p. ej. `error`) lo sobrescribe. Úsalo en asistentes de alta, importaciones y procesos con un orden fijo.

Familia: Navegación · Doc: `/docs#/components/stepper` · Fuente: `src/components/navigation/Stepper.tsx`

```ts
import { Stepper } from "@/components/navigation/Stepper"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `steps` | `StepperStep[]` |  | `{ id, label, description?, status? }`. El `status` explícito sobrescribe el derivado de `current`. |
| `current` | `number` |  | Índice (base 0) del paso activo. Los anteriores se marcan como completados. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Horizontal reparte los pasos a lo ancho; vertical los apila con el conector a la izquierda. |
| `size` | `"sm" \| "default"` | `"default"` | Círculo de 24px o 28px. |
| `onStepClick` | `(index: number) => void` |  | Vuelve clicables los pasos completados, el actual y los que tienen error. Los pendientes quedan `disabled`. |
| `...props` | `React.HTMLAttributes<"ol">` |  | Atributos nativos del `<ol>` (lleva `aria-label="Progreso"` por defecto). |

## Guías

- Sí: Usa entre 3 y 6 pasos; con más, agrúpalos o cambia a una lista de tareas.
- Sí: Etiqueta cada paso con un sustantivo corto («Requisitos»), no con una frase.
- Sí: Permite volver atrás con `onStepClick`; avanzar debe pasar por la validación del paso actual.
- No: No lo uses como navegación entre secciones sin orden: ahí van Tabs.
- No: No marques `error` en un paso pendiente; solo en uno que ya se intentó completar.
- No: No ocultes el stepper en móvil sin dejar un indicador «Paso 2 de 4».

Relacionados: tabs-nav, thema-tabs, progress, breadcrumbs

## Ejemplos

### Alta de vacante en 4 pasos

El estado vive fuera: `current` avanza con los botones y `onStepClick` permite volver a un paso ya completado. Los pendientes quedan deshabilitados.

```tsx
const [current, setCurrent] = React.useState(1);

<Stepper steps={steps} current={current} onStepClick={setCurrent} />
<Button onClick={() => setCurrent((s) => s + 1)}>Siguiente</Button>
```

### Vertical con descripción

En paneles laterales o resúmenes, la orientación vertical deja sitio a una línea de ayuda bajo cada etiqueta.

```tsx
<Stepper orientation="vertical" current={2} steps={[
  { id: "datos", label: "Datos de la vacante", description: "Título, área y ubicación" },
  { id: "requisitos", label: "Requisitos", description: "Experiencia y competencias" },
  { id: "evaluacion", label: "Evaluación", description: "Pruebas y entrevistas" },
  { id: "publicacion", label: "Publicación", description: "Canales y fecha de cierre" },
]} />
```

### Paso con error

Una importación de usuarios donde el mapeo de columnas falló: `status: "error"` pinta el círculo y la etiqueta en destructivo sin mover el paso actual.

```tsx
<Stepper
  current={2}
  steps={[
    { id: "archivo", label: "Subir archivo" },
    { id: "columnas", label: "Mapear columnas", status: "error" },
    { id: "revision", label: "Revisar" },
    { id: "importar", label: "Importar" },
  ]}
/>
```

### Tamaño sm

Círculos de 24px para cabeceras de drawer o barras de progreso secundarias.

```tsx
<Stepper size="sm" current={3} steps={steps} />
```
