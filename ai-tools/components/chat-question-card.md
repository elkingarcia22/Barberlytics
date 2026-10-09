# ChatQuestionCard (beta)

Una pregunta del agente con opciones numeradas: se contesta tocando, con la tecla del número o escribiendo en «Otro». Con título es una tarjeta completa: la pregunta y su ayuda arriba con la flecha para plegarla, buscador para listas largas, cada opción con descripción y bandera o foto, y varias a la vez con un botón para confirmar. Respondida, se pliega y deja lo elegido.

Familia: IA · Doc: `/docs#/components/chat-question-card` · Fuente: `src/components/chat/ChatQuestionCard.tsx`

```ts
import { ChatQuestionCard } from "@/components/chat"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `question` | `ChatQuestion` |  | Las opciones y, opcionales: title, hint, details (descripción, emoji o image por opción), searchPlaceholder, multiple { confirmLabel }, otherLabel, otherPlaceholder y answer. |
| `active` | `boolean` |  | Se puede responder: es la última pregunta de la conversación. |
| `onAnswer` | `(option: string) => void` |  | La opción elegida; con multiple, las elegidas unidas por « · » (CHAT_MULTIPLE_SEPARATOR). |

## Guías

- Sí: Úsala para cada elección dentro de una conversación: es más chat que meter un formulario en el hilo.
- Sí: Pon buscador cuando la lista pase de unas ocho opciones.
- Sí: Lo que se escribe (un teléfono, un código, un nombre) va en la caja del chat, no en la tarjeta.
- No: No metas formularios dentro de la tarjeta: para datos sensibles (una tarjeta de pago) abre una hoja aparte.
- No: No repitas la pregunta en un mensaje y en el título: el título ya es la pregunta.

Relacionados: chat-thread, chat-composer, chip

## Ejemplos

### Lista con buscador y descripción

La pregunta como título, el buscador y cada opción con su bandera o su descripción. Escribe en el buscador o pulsa un número.

```tsx
<ChatQuestionCard
  active
  onAnswer={setAnswer}
  question={{
    title: "¿En qué país quieres buscar prospectos?",
    options: ["Colombia", "México", "Chile", "Argentina", "Brasil", "Perú", "Uruguay"],
    details: { Colombia: { emoji: "🇨🇴" }, México: { emoji: "🇲🇽" } },
    searchPlaceholder: "Buscar país",
  }}
/>
```

### Varias a la vez y «Otro»

Se marcan varias y se confirman con el botón; «Otro» deja escribir la respuesta.

```tsx
<ChatQuestionCard question={{ title: "¿Qué te vas a hacer?", hint: "Puedes elegir varios.", options, details, multiple: { confirmLabel: "Continuar" } }} active onAnswer={setAnswer} />
```

### Sin título (en una respuesta del hilo)

La forma corta que usa el chat de ayuda: solo las opciones numeradas y «Otro».

```tsx
<ChatQuestionCard question={{ options: ["Una", "Dos", "Tres"], otherPlaceholder: "Escribe cuántos" }} active onAnswer={setAnswer} />
```
