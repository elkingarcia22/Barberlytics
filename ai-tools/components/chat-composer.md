# ChatComposer (beta)

La caja de escribir del chat: el borde que recorre y la malla al enfocar, Enter envía y Shift+Enter baja de línea, el «+» con conectores y archivos (⌘U), Voz y el botón de enviar con halo. Encima, chips para arrancar; dentro, el aviso de novedad y la pastilla de contexto.

Familia: IA · Doc: `/docs#/components/chat-composer` · Fuente: `src/components/chat/ChatComposer.tsx`

```ts
import { ChatComposer } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `value / onChange` | `string / (value) => void` |  | El texto, controlado. |
| `onSend` | `(text, files) => void` |  | Con el texto recortado y los archivos; la caja se vacía sola. |
| `news` | `ChatNews` |  | El aviso «Nuevo» encima del texto, con «Ver qué cambió» y cerrar. |
| `contextChip` | `string` |  | El objeto sobre el que responde el agente. |
| `connectors / onToggleConnector / onAddConnectors` | `ChatConnector[] / …` |  | El submenú Conectores del «+», con interruptores. |
| `onVoice` | `() => void` |  | Sin esto no hay botón Voz. |
| `chips / onChip` | `string[] / (text) => void` |  | Preguntas para arrancar, encima de la caja. |
| `compact` | `boolean` | `false` | Una fila, para el pie de un hilo. |
| `maxFiles / maxSizeMb` | `number` | `10 / 25` | Los límites del adjunto; se muestran en el menú. |
| `attachKind` | `"files" \| "photos"` | `"files"` | Qué se adjunta: el menú «+» con conectores y documentos, o un botón de imagen que abre la galería o la cámara y deja las fotos en miniatura (la nota para el barbero en la reserva). |

## Guías

- Sí: Una sola caja por pantalla: es la misma en el panel, en pantalla completa y al volver de la voz.
- Sí: Deja el aviso «puede cometer errores» salvo en un pie muy apretado.
- No: No metas el aviso de novedad en el panel: ahí no cabe; va en la pantalla completa.
- No: No la uses como buscador: para buscar está GlobalSearch.

Relacionados: chat-thread, chat-panel, chat-screen, chat-voice-mode
