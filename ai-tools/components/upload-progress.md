# UploadProgress

Barra de progreso con etiqueta, descripción, porcentaje y un icono por estado (cargando, validando, éxito, error). Es totalmente controlada: no tiene temporizadores, el padre decide el valor y el estado.

Familia: Archivos · Doc: `/docs#/components/upload-progress` · Fuente: `src/components/upload/UploadProgress.tsx`

```ts
import { UploadProgress } from "@/components/upload"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value` | `number` | `0` | Progreso de 0 a 100. |
| `status` | `"idle" \| "validating" \| "uploading" \| "success" \| "error"` | `"idle"` | Estado actual; controla icono, color y si se muestra el porcentaje. |
| `label` | `string` |  | Texto principal. También alimenta `aria-label`. |
| `description` | `string` |  | Texto secundario (nombre, tamaño, filas). |
| `error` | `string` |  | Mensaje que reemplaza la descripción cuando `status` es `error`. |
| `showValue` | `boolean` | `true` | Muestra el porcentaje a la derecha (nunca en `idle`). |
| `className` | `string` |  | Clases extra para el contenedor. |

## Guías

- Sí: Mantén el valor y el estado en el padre; el componente no adivina nada.
- Sí: Pasa el `error` real del servidor: el usuario necesita saber si reintentar.
- Sí: Usa `validating` para el tramo posterior a la subida (parseo, chequeos).
- No: No lo uses como spinner indeterminado: si no conoces el progreso, usa Skeleton o un loader.
- No: No cambies a `success` antes de que el servidor confirme.

Relacionados: progress, import-csv-panel, upload-zone

## Ejemplos

### Carga simulada

Un `setInterval` en el padre sube el valor; al llegar a 100 pasa a `validating` y luego a `success`. El componente solo pinta.

```tsx
const [value, setValue] = React.useState(0);
const [status, setStatus] = React.useState<UploadProgressStatus>("idle");

React.useEffect(() => {
  if (status !== "uploading") return;
  const timer = window.setInterval(() => {
    setValue((prev) => {
      if (prev + 4 >= 100) {
        window.clearInterval(timer);
        setStatus("validating");
        return 100;
      }
      return prev + 4;
    });
  }, 120);
  return () => window.clearInterval(timer);
}, [status]);

<UploadProgress value={value} status={status} label={STATUS_LABEL[status]} description="informe-trimestral.pdf · 1.2 MB" />
<Button onClick={() => { setValue(0); setStatus("uploading"); }}>Iniciar carga</Button>
```

### Estados

El icono y el color cambian con `status`; en `idle` se oculta el porcentaje.

```tsx
<UploadProgress status="idle" value={0} label="En espera" description="Selecciona un archivo" />
<UploadProgress status="uploading" value={58} label="Cargando archivo…" />
<UploadProgress status="validating" value={100} label="Validando datos…" />
<UploadProgress status="success" value={100} label="Carga completada" description="1.240 filas importadas" />
<UploadProgress status="error" value={73} label="Falló la carga" error="Se perdió la conexión a mitad de la carga." />
```

### Sin porcentaje ni etiqueta

Con `showValue={false}` y sin `label` queda solo la barra y el icono: útil en filas de una tabla.

```tsx
<UploadProgress status="uploading" value={30} showValue={false} />
```
