# Comentarios de revisión de la reserva

Los comentarios que se dejan sobre la vista previa de «Agendamiento online» (pins al estilo Figma) se
guardan en una **hoja de Google** para que no se pierdan al recargar ni al volver a desplegar.

## Cómo funciona

- Cada acción es **una fila nueva**: comentar, responder, resolver, reabrir y eliminar. Nada se edita
  ni se borra en la hoja; el estado de cada hilo se reconstruye leyéndola en orden
  (`src/features/booking/comments/commentEvents.ts`, `reduceEvents`).
- Columnas de la pestaña «Acciones»: `fecha, accion, hilo, mensaje, autor_id, autor, texto, x, y, vista,
  vista_nombre, evento_id`. Se puede filtrar y contar como cualquier Excel.
- La página lee `/api/comments` al abrir, cada 15 s y al volver a la pestaña; cada acción se manda por
  `POST /api/comments`. Reintentar no duplica filas (cada acción lleva un id).
- Cada navegador se presenta una vez con su nombre (queda en `localStorage`): es la firma de sus
  comentarios. «No leído» es de cada navegador y no se guarda.
- Si el servidor no responde (en local, sin configurar o sin red) los comentarios siguen en memoria y se
  reintentan.

## Configurarlo en Vercel

Usa la misma cuenta de servicio del feedback (`docs/FEEDBACK_LOOP.md`):

| Variable | Para qué |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | La clave de la cuenta de servicio. |
| `FEEDBACK_SHARE_WITH` | Correos que reciben edición sobre la hoja al crearla. **Sin esto ni `COMMENTS_SHEET_LINK_ACCESS`, nadie puede abrirla.** |
| `COMMENTS_SHEET_LINK_ACCESS` | Opcional: `reader` o `writer` abre la hoja a cualquiera que tenga el enlace (sin listar correos). Se aplica también a una hoja que ya existía. Si la organización de Google bloquea los enlaces públicos, no se aplica y queda solo para `FEEDBACK_SHARE_WITH`. |
| `COMMENTS_SHEET_ID` | Opcional: el id de una hoja ya existente (compartida con la cuenta de servicio). |

La primera vez que alguien comenta, la función crea «Comentarios · Agendamiento online» (se encuentra
después por una propiedad de Drive, sin guardar su id). Código: `server/comments/`, `api/comments/`.

La reserva exportada a `booking-flow` (`npm run export:booking`) incluye la función; allí se ponen las
mismas variables en Vercel.
