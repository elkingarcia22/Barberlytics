# ChatScreen (beta)

El chat a pantalla completa: lo que AdminShell enseña en modo «Agente IA» cuando la app lo pasa en `config.agentView`. A la izquierda, el historial con «Nuevo chat» (ChatHistoryPanel), que se pliega a una tira; una conversación nueva arranca en la portada de Clipper —la misma de la reserva—: rejilla de puntos, orbe, nombre y saludo, la caja y las ideas numeradas debajo (ChatIdeas); con hilo, los mensajes ocupan la pantalla y la caja se queda abajo.

Familia: IA · Doc: `/docs#/components/chat-screen` · Fuente: `src/components/chat/ChatScreen.tsx`

```ts
import { ChatScreen, ChatHistoryList } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `history` | `boolean` | `true` | El historial a la izquierda, con «Nuevo chat»; se pliega y recuerda cómo lo dejaste. |
| `onMore` | `(messageId, action) => void` |  | El menú «Más» de cada respuesta. |

## Guías

- Sí: Con `agentSidebar: "navigation"` la barra lateral sigue llevando a las pantallas y el historial vive junto al chat; tocar una pantalla sale del modo agente.
- No: No hagas una página con ruta para el chat: es un modo del shell, y la URL se queda donde estaba.

Relacionados: chat-panel, chat-thread, chat-composer, admin-shell

## Ejemplos

### El historial

Hoy, Ayer, Últimos 7 días y Anteriores; el punto dice si hay respuesta sin leer o si el agente sigue escribiendo. Es lo que el sidebar enseña en modo agente.

```tsx
<ChatHistoryList activeId={activeId} onSelect={setActive} onNew={newConversation} onRemove={remove} />
```
