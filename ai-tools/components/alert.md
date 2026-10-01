# Alert

Aviso en línea que llama la atención sobre un mensaje sin interrumpir el flujo. Úsalo para contextualizar una pantalla o sección con información, éxito, advertencia o error; para mensajes efímeros usa un toast.

Familia: Primitivos · Doc: `/docs#/components/alert` · Fuente: `src/components/ui/alert.tsx`

```ts
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `variant` | `"default" \| "info" \| "success" \| "warning" \| "destructive"` | `"default"` | Intención semántica; tiñe borde, fondo, texto e icono. |
| `children` | `React.ReactNode` |  | Un SVG opcional como primer hijo, seguido de AlertTitle, AlertDescription y AlertAction. |
| `AlertAction` | `React.ComponentProps<"div">` |  | Contenedor posicionado en la esquina superior derecha para un botón o enlace. |
| `...props` | `React.ComponentProps<"div">` |  | Atributos nativos del contenedor (role="alert" ya viene puesto). |

## Guías

- Sí: Coloca el aviso cerca del contenido al que se refiere.
- Sí: Acompaña las variantes de color con un icono para no depender solo del color.
- Sí: Escribe un título corto y deja el detalle en la descripción.
- No: No apiles más de dos alertas en la misma vista.
- No: No lo uses para confirmaciones puntuales; usa un toast (Sonner).
- No: No pongas más de una acción dentro de `AlertAction`.

Relacionados: alert-dialog, badge, sonner

## Ejemplos

### Variantes semánticas

El color comunica la intención: informa, confirma, advierte o bloquea.

```tsx
<Alert variant="info">
  <Info />
  <AlertTitle>Sincronización en curso</AlertTitle>
  <AlertDescription>Los datos pueden tardar unos minutos en reflejarse.</AlertDescription>
</Alert>
<Alert variant="success">
  <CheckCircle2 />
  <AlertTitle>Curso publicado</AlertTitle>
  <AlertDescription>Ya es visible para los equipos asignados.</AlertDescription>
</Alert>
<Alert variant="warning">
  <AlertTriangle />
  <AlertTitle>Licencias por vencer</AlertTitle>
  <AlertDescription>12 licencias expiran en los próximos 7 días.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <ShieldAlert />
  <AlertTitle>No se pudo importar el archivo</AlertTitle>
  <AlertDescription>Revisa que las columnas coincidan con la plantilla.</AlertDescription>
</Alert>
```

### Sin icono

Sin SVG el contenido ocupa todo el ancho; funciona bien para notas neutras.

```tsx
<Alert>
  <AlertTitle>Modo de solo lectura</AlertTitle>
  <AlertDescription>Estás viendo una versión archivada de este reporte.</AlertDescription>
</Alert>
```

### Con acción y cierre

`AlertAction` se ancla a la esquina superior derecha; el estado de visibilidad lo controla el padre.

```tsx
const [visible, setVisible] = React.useState(true);

{visible && (
  <Alert variant="info">
    <Info />
    <AlertTitle>Nueva versión disponible</AlertTitle>
    <AlertDescription>Actualiza para obtener los últimos reportes de aprendizaje.</AlertDescription>
    <AlertAction>
      <Button variant="ghost" size="icon-xs" aria-label="Cerrar" onClick={() => setVisible(false)}>
        <X />
      </Button>
    </AlertAction>
  </Alert>
)}
```
