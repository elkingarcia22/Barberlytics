# ChatPanel (beta)

El chat como panel lateral: se porta al ancla de AdminShell (la pantalla se estrecha, no se tapa) y flota a OVERLAY_INSET del borde. Arranca con el saludo, la caja y unas preguntas; con conversación, el hilo arriba y la caja abajo. Desde la cabecera: otra conversación o abrirla en pantalla completa.

Familia: IA · Doc: `/docs#/components/chat-panel` · Fuente: `src/components/chat/ChatPanel.tsx`

```ts
import { ChatPanel, ChatProvider } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onOpenChange` | `boolean / (open) => void` |  | Abierto o cerrado; Escape cierra. |
| `title / subtitle` | `string` | `«Agente IA» / «Asistente de la plataforma»` | La cabecera; el chat de ayuda pone «Ayuda». |

## Guías

- Sí: Monta un solo ChatProvider en la app: el panel y la pantalla completa comparten conversaciones e historial.
- No: No abras el panel y el modo agente a la vez: es el mismo chat en dos sitios.

Relacionados: chat-screen, chat-composer, chat-thread, ai-agent-drawer

## Ejemplos

### Dentro del shell

Sustituye a AiAgentDrawer: mismo ancla, mismo movimiento, pero con conversación de verdad. «Pregúntame» del menú Ayuda abre este panel con el centro de ayuda como fuente.

```tsx
const [open, setOpen] = React.useState(false);

<ChatProvider value={{ store, backend, user, lang: "es-CO", onOpenFull: openAgentMode, onOpenVoice }}>
  <AdminShell config={config}>
    …
    <ChatPanel open={open} onOpenChange={setOpen} title="Ayuda" />
  </AdminShell>
</ChatProvider>
```
