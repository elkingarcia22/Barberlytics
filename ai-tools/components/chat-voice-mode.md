# ChatVoiceMode (beta)

El modo voz, a pantalla completa: en `immersive` siempre en oscuro con la malla de IA; en `page` (el de Clipper, lo usan la app y la reserva) sigue el tema sobre la rejilla de puntos. Las ondas escuchan con el reconocimiento de voz del navegador, lo dicho se lee grande, y al hacer una pausa llega la respuesta con sus dos botones (el detalle y la primera sugerencia). La píldora de abajo pausa, vuelve a escribir o envía. Sin micrófono lo dice y deja escribir.

Familia: IA · Doc: `/docs#/components/chat-voice-mode` · Fuente: `src/components/chat/ChatVoiceMode.tsx`

```ts
import { ChatVoiceMode } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `open / onClose` | `boolean / () => void` |  | Abierto o cerrado; Escape cierra. |
| `onWrite` | `(text) => void` |  | «Escribir»: volver al chat con lo dicho. |
| `onSend` | `(text) => void` |  | Terminar: lo dicho (o la sugerencia elegida) va al chat. |
| `appearance / backdrop` | `"immersive" \| "page" / ReactNode` | `"immersive"` | `page` sigue el tema sobre la rejilla de puntos de Clipper; `backdrop` la sustituye. |

## Guías

- Sí: Usa `lang` del ChatProvider (`es-CO`, `en-US`): es el idioma en que escucha y en que lee en voz alta.
- No: No lo abras desde el panel en un contenedor angosto sin sitio: es a pantalla completa.

Relacionados: chat-composer, chat-panel

## Ejemplos

### Abrir el modo voz

Pide permiso de micrófono la primera vez. En un navegador sin Web Speech enseña el aviso y el botón Escribir.

```tsx
<ChatVoiceMode open={open} onClose={close} onWrite={(text) => setDraft(text)} onSend={(text) => send(text)} />
```
