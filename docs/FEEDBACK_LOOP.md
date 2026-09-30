# Feedback masivo de campañas

Cuando se lanza algo en la plataforma queremos oír a todo el mundo, no a cinco personas en una
entrevista. Todo vive en este repo: no hay n8n ni ningún servicio intermedio.

```
Navegador                         Función de Vercel (api/feedback)              Google / Claude
──────────────────────            ───────────────────────────────────           ─────────────────────
recorrido la 1.ª vez                                                             
botón «Feedback»  ──POST /api/feedback──▶ valida ─▶ busca/crea la hoja ─────▶  Hoja «Feedback · <campaña>»
en todas las páginas                                 y añade la fila             pestaña «Comentarios»

                  Cron de Vercel, viernes 8:00 (Bogotá)
                  ──GET /api/feedback/analyze──▶ lee «Comentarios» ─▶ Claude ─▶ pestaña «Resumen»
                  (o POST a mano con la clave)   (solo si hay comentarios nuevos)
```

## Activar una campaña

1. **Define la campaña** en [`campaignRegistry.ts`](../src/features/feedback/campaignRegistry.ts)
   (id, nombre y secciones) y, si quieres recorrido, dale sus pasos en
   [`campaigns.ts`](../src/features/feedback/campaigns.ts).
2. **Apúntala como activa**: `ACTIVE_CAMPAIGN_DEFINITION`. Despliega.
3. **La hoja se crea sola** la primera vez que hace falta: con el primer comentario, con la
   activación explícita (abajo) o con el primer cron. Para tenerla lista antes de que escriba
   nadie:

   ```bash
   curl -X POST https://TU-DOMINIO/api/feedback/activate -H "Authorization: Bearer $FEEDBACK_ADMIN_KEY"
   ```

   La respuesta trae `spreadsheetUrl`, a quién se le compartió y un `warning` si nadie tiene acceso.
4. **Cerrar la escucha**: `ACTIVE_CAMPAIGN_DEFINITION = null` y desplegar. El botón y el recorrido
   desaparecen y el servidor deja de aceptar comentarios. La hoja se conserva.

Una campaña nueva (otro `id`) empieza de cero: todos vuelven a ver el recorrido y sus respuestas
van a una hoja propia.

## Preparar el servidor (una sola vez)

1. En [Google Cloud](https://console.cloud.google.com/) crea un proyecto y activa **Google Drive API**
   y **Google Sheets API**.
2. Crea una **cuenta de servicio** y una clave JSON para ella. Ella será la dueña de las hojas.
3. En Vercel (Project → Settings → Environment Variables) define:

| Variable | Qué es |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | El JSON de la clave, tal cual o en base64. |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude, para el resumen. |
| `FEEDBACK_SHARE_WITH` | Correos (separados por comas) que reciben edición sobre cada hoja. **Sin esto nadie puede abrirla.** |
| `FEEDBACK_ADMIN_KEY` | Una clave larga y aleatoria para activar o analizar a mano. |
| `CRON_SECRET` | Otra, aleatoria. Vercel la manda sola en cada ejecución del cron. |
| `FEEDBACK_MODEL` | Opcional. Por defecto `claude-sonnet-5-5`. |

Son variables **del servidor**: no llevan prefijo `VITE_` y no llegan al navegador.

## Qué hay en la hoja

Una hoja por campaña, «Feedback · <nombre>», con dos pestañas que el servidor crea con su
cabecera fija:

- **Comentarios** — una fila por comentario: `fecha_recibido, fecha_envio, campana_id, campana,
  pagina, ruta, seccion, comentario, usuario, correo, rol`.
- **Resumen** — una fila por análisis: `fecha_analisis, campana_id, campana, total_comentarios,
  desde, hasta, resumen, sentimiento, temas_principales, prioridades, quick_wins, riesgos,
  metricas_sugeridas, modelo`.

No hay base de datos: el servidor encuentra la hoja de cada campaña por una propiedad que ella
misma lleva en Drive, así que cualquier instancia de la función llega a la misma.

## Análisis con Claude

- El cron de [`vercel.json`](../vercel.json) llama cada viernes 13:00 UTC (8:00 en Bogotá).
  Para pedirlo a mano: `curl -X POST https://TU-DOMINIO/api/feedback/analyze -H "Authorization: Bearer $FEEDBACK_ADMIN_KEY"`.
- Lee «Comentarios» y, **si hay comentarios nuevos desde el último resumen**, pide a Claude un
  análisis (los 400 más recientes; totales por sección, página y rol) y añade una fila a «Resumen».
  Sin novedades no gasta otra llamada.
- Si Claude falla o no devuelve JSON no se escribe nada y el endpoint responde 502; el detalle
  queda en los logs de la función.
- El prompt trata los comentarios como datos: si uno trae instrucciones, Claude las ignora.
- `maxDuration` de la función es 60 s, el tope del plan gratuito.
- Solo se analiza la campaña activa: no la cierres sin haber dejado correr un último análisis.

## Seguridad

- Los comentarios se escriben con `valueInputOption=RAW`: Sheets los guarda como texto, así que uno
  que empiece por `=` no se evalúa como fórmula.
- `POST /api/feedback` solo acepta la campaña activa (nadie puede llenar la cuenta de hojas
  inventando ids), limita el cuerpo a 10 KB, valida con Zod y rechaza peticiones de otro origen.
- `activate` y `analyze` exigen `Authorization: Bearer` con la clave de administración o el secreto
  del cron (comparación en tiempo constante). Sin ninguna configurada, nadie entra.
- Las credenciales de Google y de Claude solo existen en el servidor.
- **Límites que conviene saber:** el endpoint de comentarios es público (es un formulario) y no tiene
  límite de frecuencia; añade una regla en el WAF/Firewall de Vercel si te preocupa el abuso. Y
  `usuario`, `correo` y `rol` los manda el navegador: sirven para contextualizar, no como prueba de
  identidad, mientras la app no tenga un backend propio que los verifique.

## Piezas

| Pieza | Dónde |
|---|---|
| Componentes (recorrido, botón, panel, campaña) | `src/components/feedback-loop/`, con fichas en `/docs` → «Feedback de usuarios» |
| Cableado con la app (campaña, página, persona) | `src/features/feedback/` (`FeedbackHost` está montado en `AppLayout`) |
| Endpoints | `api/feedback/` (`index.ts`, `activate.ts`, `analyze.ts`) |
| Lógica del servidor | `server/feedback/` (Google, hoja, análisis, servicio) y sus pruebas |
| Backend simulado en desarrollo | `src/mocks/handlers.ts` → `POST /api/feedback` |

En desarrollo (`npm run dev`) el envío va al mock y no toca Google. Para probar las funciones de
verdad en local usa `vercel dev` con las variables en `.env.local`.
