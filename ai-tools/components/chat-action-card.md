# ChatActionCard (beta)

Un cambio que el agente propone y la persona aplica: qué cambia (lo de antes tachado, lo nuevo al lado), los avisos y «Aplicar» o «Descartar». Nada se toca hasta aplicar; aplicado, queda «Deshacer» y el enlace para verlo. Es como Clipper mueve, crea o cancela citas, bloquea ratos y anota en la ficha.

Familia: IA · Doc: `/docs#/components/chat-action-card` · Fuente: `src/components/chat/ChatActionCard.tsx`

```ts
import { ChatActionCard } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `action` | `ChatAction` |  | title, rows ({ label, before?, after }), warnings?, status (proposed, applying, applied, discarded, undoing, undone, failed), undo?, href? y error?. |
| `onApply` | `() => void` |  | Aplicar (o reintentar si falló). Sin esto, la tarjeta solo muestra la propuesta. |
| `onUndo` | `() => void` |  | Deshacer; sale cuando está aplicada y trae `undo`. |
| `onDiscard` | `() => void` |  | Descartar la propuesta. |
| `onNavigate` | `(href: string) => void` |  | El enlace «Ver» al resultado, si trae `href`. |

## Guías

- Sí: Una tarjeta por cambio: si el agente propone tres, son tres tarjetas que se aplican por separado.
- Sí: Pon en los avisos lo que cambia la decisión (un choque, un dato de salud, un pago en línea).
- No: No apliques nada sin el toque de la persona: la tarjeta es la confirmación.
- No: No escondas el antes: sin él no se puede revisar ni deshacer con confianza.

Relacionados: chat-thread, chat-question-card

## Ejemplos

### Mover una cita, con un choque

Aplica para ver el estado aplicado con «Deshacer»; descarta para cerrarla. En la app, el chat la pinta sola cuando la respuesta trae `actions`.

```tsx
<ChatActionCard action={action} onApply={apply} onUndo={undo} onDiscard={discard} onNavigate={navigate} />
```
