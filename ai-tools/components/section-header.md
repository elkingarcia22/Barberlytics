# SectionHeader

El encabezado de una sección interna de página: eyebrow, título en 18px, descripción y un slot de acciones alineado abajo a la derecha, cerrado con una línea. Úsalo para separar bloques dentro de una misma vista, entre el PageHeader y el contenido.

Familia: Utilidades · Doc: `/docs#/components/section-header` · Fuente: `src/components/utility/SectionHeader.tsx`

```ts
import { SectionHeader } from "@/components/utility"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `title` | `string` |  | Título de la sección, renderizado como h3. |
| `description` | `string` |  | Texto secundario bajo el título. |
| `eyebrow` | `string` |  | Texto pequeño sobre el título: paso, categoría o contexto. |
| `actions` | `React.ReactNode` |  | Botones alineados a la derecha, con gap de 8px. |
| `...props` | `React.HTMLAttributes<HTMLDivElement>` |  | Atributos del contenedor. |

## Guías

- Sí: Uno por bloque de contenido; deja que la línea inferior separe las secciones.
- Sí: Limita las acciones a dos y hazlas secundarias (outline o ghost).
- Sí: Usa el eyebrow para el contexto que el título no necesita repetir.
- No: No lo uses como encabezado de página: para eso está PageHeader.
- No: No apiles dos SectionHeader sin contenido entre ellos.

Relacionados: page-header, form-section, button

## Ejemplos

### Título y descripción

```tsx
<SectionHeader title="Actividad reciente" description="Últimos 30 días." />
```

### Con acciones que cambian la sección

La descripción se recalcula al añadir integrantes.

```tsx
<SectionHeader
  title="Integrantes"
  description={`${count} persona(s) en este equipo.`}
  actions={<Button size="sm" onClick={add}><Plus /> Añadir</Button>}
/>
```

### Eyebrow y varias acciones

```tsx
<SectionHeader
  eyebrow="Reportes"
  title="Avance por equipo"
  actions={
    <>
      <Button size="sm" variant="ghost"><Filter /> Filtrar</Button>
      <Button size="sm" variant="outline">Exportar</Button>
    </>
  }
/>
```
