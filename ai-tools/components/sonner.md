# Toaster / toast()

El Toaster de Sonner afinado con los tokens Thema: iconos por tipo, bordes tintados y un botón de cierre de 28px que sí se puede pulsar. Se monta una sola vez (la app ya lo hace vía ThemaToaster) y desde cualquier pantalla se dispara con `toast()`.

Familia: Primitivos · Doc: `/docs#/components/sonner` · Fuente: `src/components/ui/sonner.tsx`

```ts
import { toast } from "sonner"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `toast(title, options?)` | `función` |  | Dispara un toast neutro. `toast.success/info/warning/error/loading` cambian icono y borde. |
| `options.description` | `string` |  | Segunda línea en color secundario. |
| `options.action` | `{ label, onClick }` |  | Botón primario dentro del toast. |
| `options.duration` | `number` | `4000` | Milisegundos en pantalla; `Infinity` lo hace persistente. |
| `options.id` | `string \| number` |  | Reutiliza un toast existente (p. ej. actualizar un `loading`). |
| `toast.promise(promise, { loading, success, error })` | `función` |  | Encadena los tres estados en un mismo toast. |
| `<Toaster />` | `componente` |  | El contenedor de `@/components/ui/sonner`. Ya está montado a través de ThemaToaster; no montes otro. |

## Guías

- Sí: Confirma lo que acaba de ocurrir en una línea; usa la descripción para el detalle.
- Sí: Ofrece «Deshacer» en lugar de pedir confirmación previa cuando la acción es reversible.
- Sí: Reutiliza el `id` para actualizar un toast de carga en vez de apilar dos.
- No: No montes un segundo `<Toaster />`: cada toast saldría duplicado.
- No: No uses toasts para errores que bloquean el flujo; ahí va Alert o AlertDialog.
- No: No abuses de `duration: Infinity`; solo para avisos que requieren acción.

Relacionados: thema-toaster, alert, alert-dialog, button

## Ejemplos

### Tipos

Cada tipo trae su icono y tinte de borde; el fondo se mantiene sobrio.

```tsx
toast("Nota guardada");
toast.success("Encuesta publicada");
toast.info("Hay una versión nueva disponible");
toast.warning("Quedan 2 asientos");
toast.error("No se pudo conectar");
```

### Con acción (deshacer)

El patrón para acciones reversibles: se ejecuta de inmediato y el toast ofrece revertirla.

```tsx
toast("Encuesta eliminada", {
  description: "Clima Q3 se movió a la papelera.",
  action: { label: "Deshacer", onClick: restore },
});
```

### Promesa

Un solo toast que pasa de cargando a éxito o error según resuelva la promesa.

```tsx
toast.promise(uploadFile(file), {
  loading: "Subiendo archivo…",
  success: (name) => `${name} se importó correctamente`,
  error: "No se pudo subir el archivo",
});
```

### Persistente y cierre programático

`duration: Infinity` lo deja fijo; `toast.dismiss(id)` lo cierra desde código.

```tsx
const id = toast.warning("Tu sesión expira en 5 minutos", {
  description: "Guarda los cambios pendientes.",
  duration: Infinity,
});

toast.dismiss(id);
```
