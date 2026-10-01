# Accordion

Lista de secciones plegables con un encabezado que muestra u oculta su contenido. Úsalo para preguntas frecuentes, ajustes agrupados o cualquier contenido largo que el usuario no necesita ver de golpe.

Familia: Primitivos · Doc: `/docs#/components/accordion` · Fuente: `src/components/ui/accordion.tsx`

```ts
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `"single" \| "multiple"` |  | Si solo una sección puede estar abierta o varias a la vez. |
| `collapsible` | `boolean` | `false` | En modo single, permite cerrar la sección abierta haciendo clic de nuevo. |
| `value / defaultValue` | `string \| string[]` |  | Sección(es) abierta(s). Usa `value` + `onValueChange` para controlarlo. |
| `onValueChange` | `(value) => void` |  | Se dispara cuando cambia la sección abierta. |
| `disabled` | `boolean` | `false` | Desactiva todos los triggers. |
| `AccordionItem.value` | `string` |  | Identificador único de la sección (obligatorio). |

## Guías

- Sí: Redacta los encabezados como preguntas o títulos cortos que anticipen el contenido.
- Sí: Abre por defecto la sección más relevante si el usuario la necesita de inmediato.
- Sí: Usa `multiple` cuando el usuario compara información entre secciones.
- No: No escondas en un acordeón contenido crítico o acciones primarias.
- No: No anides acordeones dentro de acordeones.
- No: No lo uses para navegación; para eso están Tabs o la sub-navegación.

Relacionados: tabs, card

## Ejemplos

### Una sección a la vez

`type="single"` con `collapsible` permite cerrar la sección abierta.

```tsx
<Accordion type="single" collapsible defaultValue="plans">
  <AccordionItem value="plans">
    <AccordionTrigger>¿Puedo cambiar de plan más adelante?</AccordionTrigger>
    <AccordionContent>Sí. El cambio se aplica al instante y el cobro se prorratea.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="seats">
    <AccordionTrigger>¿Cómo se cuentan los asientos?</AccordionTrigger>
    <AccordionContent>Cada usuario activo del mes cuenta como un asiento.</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Varias abiertas

Con `type="multiple"` cada sección se abre y cierra de forma independiente.

```tsx
<Accordion type="multiple" defaultValue={["plans", "support"]}>
  <AccordionItem value="plans">…</AccordionItem>
  <AccordionItem value="seats">…</AccordionItem>
  <AccordionItem value="support">…</AccordionItem>
</Accordion>
```

### Controlado

El estado vive fuera: útil para botones de «expandir todo» o para sincronizar con la URL.

```tsx
const [open, setOpen] = React.useState<string[]>(["plans"]);

<Button size="sm" variant="outline" onClick={() => setOpen(["plans", "seats", "support"])}>Expandir todo</Button>
<Button size="sm" variant="ghost" onClick={() => setOpen([])}>Colapsar todo</Button>

<Accordion type="multiple" value={open} onValueChange={setOpen}>
  …
</Accordion>
```
