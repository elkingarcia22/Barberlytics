# ThemaToaster

El contenedor de toasts de Sonner con los ajustes Thema: apilados arriba a la derecha, por debajo del header, sin colores saturados y con botón de cierre. Se monta una sola vez a nivel de app (esta documentación ya lo hace); desde cualquier pantalla solo se llama a `toast()` de `sonner`.

Familia: Feedback · Doc: `/docs#/components/thema-toaster` · Fuente: `src/components/feedback/ThemaToaster.tsx`

```ts
import { ThemaToaster } from "@/components/feedback/ThemaToaster"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `topOffset` | `number` | `76` | Distancia en px desde el borde superior a la pila de toasts; libra el header de la app. |
| `id` | `string` |  | Contenedor propio: solo recibe los toasts enviados con ese toasterId (y el de la app deja de pintarlos). Lo usa la reserva en línea para que sus avisos salgan dentro de su marco. |
| `position` | `"top-right" \| "top-center" \| …` | `"top-right"` | Dónde se apila. La reserva usa top-center en celular, tablet y widget. |
| `className` | `string` |  | Clases extra sobre el contenedor de Sonner. |
| `style` | `React.CSSProperties` |  | Estilos inline sobre el contenedor. |

## Guías

- Sí: Monta `<ThemaToaster />` una sola vez, en el root de la app.
- Sí: Usa `toast.success` para confirmar lo que acaba de pasar y `toast.error` para lo que falló.
- Sí: Añade `action` cuando el usuario pueda deshacer o ir al resultado.
- No: No montes un segundo Toaster sin `id`: cada toast se pintaría dos veces. Una superficie embebida (la reserva en su marco) monta el suyo con `id` y le manda los toasts con `toasterId`.
- No: No uses el toast como única señal de un formulario: el error va junto al campo; el toast solo lo repite al intentar seguir.
- No: No uses `richColors`: el sistema mantiene el fondo sobrio y colorea solo icono y borde.

Relacionados: alert, button, alert-dialog

## Ejemplos

### Tipos

Cada tipo trae su icono semántico y un borde teñido muy leve; el fondo es siempre el del popover.

```tsx
toast("Recordatorio enviado");
toast.success("Cambios guardados");
toast.info("Hay una versión nueva de la plantilla");
toast.warning("El ciclo cierra en 2 días");
toast.error("No se pudo enviar la evaluación");
```

### Con acción y descripción

Una acción para deshacer o ir al detalle; la descripción aporta el dato concreto.

```tsx
toast("Objetivo archivado", {
  description: "\"Reducir el churn un 5 %\" pasó a la lista de archivados.",
  action: { label: "Deshacer", onClick: () => restore() },
});
```

### Cargando y resolver

Un toast de carga se actualiza en sitio pasando su `id` a la siguiente llamada.

```tsx
const id = toast.loading("Exportando reporte…", { description: "Puede tardar unos segundos." });
// …cuando termina:
toast.success("Reporte listo", { id, description: "Se descargó reporte-ciclo-2026.xlsx" });
```

### Con promesa

`toast.promise` encadena los tres estados sin gestionar el id a mano.

```tsx
toast.promise(saveChanges(), {
  loading: "Guardando…",
  success: "Cambios guardados",
  error: "No se pudo guardar",
});
```
