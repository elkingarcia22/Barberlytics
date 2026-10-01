# ChatThread (beta)

El hilo: las preguntas a la derecha (copiar, editar y reenviar desde ahí) y las respuestas con el destello del agente, que se escriben solas y se pueden detener. Una respuesta trae fuentes, una tarjeta con datos, una pregunta con opciones numeradas, un enlace y las acciones: copiar, útil o no, regenerar, leer en voz alta.

Familia: IA · Doc: `/docs#/components/chat-thread` · Fuente: `src/components/chat/ChatThread.tsx`

```ts
import { ChatThread, ChatProvider } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `conversation` | `Conversation` |  | La conversación a mostrar (del almacén del ChatProvider). |
| `onMore` | `(messageId, action) => void` |  | El menú «Más» de cada respuesta: compartir, crear tarea, reportar. |

## Guías

- Sí: Deja que el hilo siga el final solo mientras la persona lo mira; si subió a releer, no la muevas.
- Sí: Solo la última respuesta enseña sugerencias y deja contestar su pregunta.
- No: No pongas títulos ni tablas en una respuesta: es un mensaje, no un documento.

Relacionados: chat-composer, chat-panel, chat-screen

## Ejemplos

### Una conversación con todo

Fuentes con su detalle al pasar, una tarjeta de barras, las sugerencias para seguir y la fila de acciones. Toca una sugerencia: se envía y responde de ejemplo.

```tsx
<ChatProvider value={{ store, backend, user, lang: "es-CO" }}>
  <ChatThread conversation={conversation} />
</ChatProvider>
```
