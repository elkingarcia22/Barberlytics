# ProcessCenter (beta)

El Centro de procesos de la cabecera: lo que sigue trabajando aunque la persona cambie de pantalla —importaciones, subidas, exportaciones— con su avance, y lo que ya terminó o falló. No lanza nada: cada pantalla publica lo suyo con `publishProcess` y el panel lo enseña. El botón lleva un punto mientras algo corre, y vacío explica qué aparecerá ahí.

Familia: Layout y shell · Doc: `/docs#/components/process-center` · Fuente: `src/components/app-shell/ProcessCenter.tsx`

```ts
import { ProcessCenter, publishProcess, updateProcess, removeProcess } from "@/components/app-shell"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `onOpenHistory` | `() => void` |  | Abre el historial completo. Sin esto el pie no ofrece «Historial». En el shell llega por `onOpenProcessHistory`. |
| `className` | `string` |  | Clases extra sobre el botón de la cabecera. |
| `publishProcess(process)` | `(process: ShellProcess) => void` |  | Añade un proceso o lo reemplaza en su sitio. Los nuevos van arriba. Publicar lo mismo dos veces no repinta nada. |
| `updateProcess(id, change)` | `(id, Partial<ShellProcess>) => void` |  | Cambia parte de uno ya publicado: el avance, la línea de detalle, que terminó. |
| `removeProcess(id)` | `(id: string) => void` |  | Lo retira de la lista. |
| `ShellProcess` | `{ id; title; meta; progress?; done?; failed?; icon?; actionLabel?; onAction? }` |  | Con `progress` (0–100) está en curso; sin él, en espera. `done` y `failed` lo dejan en la lista como terminado o fallido, con `meta` diciendo cómo acabó. |

## Guías

- Sí: Publica aquí lo que tarda y no necesita a la persona mirando: importar, subir archivos, exportar.
- Sí: Escribe en `meta` algo que se pueda leer de un vistazo: «120 de 480», «Faltan dos columnas».
- Sí: Deja el proceso como `done` o `failed` en vez de quitarlo: es lo que confirma que acabó.
- Sí: Da una acción cuando haya algo que hacer con el resultado: «Ver», «Reintentar», «Descargar».
- No: No lo uses para lo que termina en un segundo: para eso está el toast.
- No: No publiques desde un efecto sin `id` estable: cada pintado añadiría una fila nueva.
- No: No metas aquí avisos ni novedades: eso es de Notificaciones y de Novedades.

Relacionados: app-header, admin-shell, progress, empty-state

## Ejemplos

### Publicar y actualizar un proceso

Lanza la importación y abre el panel: la fila avanza sola y al terminar se queda como hecha. En la aplicación el botón vive en la cabecera; esta documentación lo apaga allí (`chrome.processes: false`) porque aquí no corre nada.

```tsx
// Quien lanza el trabajo lo publica…
publishProcess({ id: "importar-clientes", icon: "upload", title: "Importar clientes", meta: "0 de 480", progress: 0 });

// …lo va actualizando…
updateProcess("importar-clientes", { progress: 25, meta: "120 de 480" });

// …y lo deja como terminado (o fallido, con su motivo en `meta`).
updateProcess("importar-clientes", { progress: undefined, done: true, meta: "480 clientes importados", actionLabel: "Ver", onAction: abrirClientes });
```
