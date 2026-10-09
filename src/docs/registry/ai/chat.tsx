import * as React from "react";
import { ChatComposer, ChatHistoryList, ChatQuestionCard, ChatPanel, ChatScreen, ChatThread, ChatVoiceMode, useActiveConversation, useChatActions, useChatState } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";
import { DocsChat, DocsPanelHost } from "./chatDocsHost";
import { SEED_CONVERSATION, SEED_HISTORY } from "./chatDocsData";

function ComposerDemo(props: { news?: boolean; chips?: boolean; voice?: boolean; compact?: boolean; context?: boolean }) {
  const [value, setValue] = React.useState("");
  const [sent, setSent] = React.useState<string | null>(null);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <ChatComposer
        value={value}
        onChange={setValue}
        onSend={(text) => setSent(text)}
        compact={props.compact}
        news={props.news ? { text: "Ya ejecuta acciones en **Selección**.", onOpen: () => {} } : undefined}
        contextChip={props.context ? "Evaluación de desempeño · Q3" : undefined}
        onRemoveContext={props.context ? () => {} : undefined}
        chips={props.chips ? ["Plan de formación para Ventas", "Evaluaciones vencidas", "Riesgo de rotación Q3"] : undefined}
        onChip={setValue}
        onVoice={props.voice ? () => {} : undefined}
        connectors={[
          { id: "gmail", label: "Gmail", connected: true },
          { id: "slack", label: "Slack", connected: false },
          { id: "drive", label: "Google Drive", connected: true },
        ]}
        onAddConnectors={() => {}}
      />
      {sent && <p className="text-center text-xs text-text-muted">Enviado: «{sent}»</p>}
    </div>
  );
}

function ThreadDemo() {
  const conversation = useActiveConversation();
  if (!conversation) return null;
  return (
    <div className="w-full max-w-2xl">
      <ChatThread conversation={conversation} />
    </div>
  );
}

function PanelDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <DocsChat value={{ onOpenFull: () => {}, onOpenVoice: () => {} }}>
      <DocsPanelHost
        content={
          <>
            <Button className="self-start" variant={open ? "outline" : "default"} onClick={() => setOpen((value) => !value)}>
              {open ? "Cerrar el chat" : "Abrir el chat"}
            </Button>
            <p className="text-sm text-text-secondary">La pantalla: al abrir el panel se estrecha, no se tapa. Toca una sugerencia y responde de ejemplo.</p>
          </>
        }
      >
        <ChatPanel open={open} onOpenChange={setOpen} />
      </DocsPanelHost>
    </DocsChat>
  );
}

function ScreenDemo({ seeded }: { seeded: boolean }) {
  return (
    <DocsChat seed={seeded ? [SEED_CONVERSATION] : undefined} value={{ news: { text: "Ya ejecuta acciones en **Selección**.", onOpen: () => {} }, onOpenVoice: () => {} }}>
      <div className="h-[640px] w-full overflow-hidden rounded-2xl border border-border/60 bg-background ai-mesh-agent">
        <ChatScreen />
      </div>
    </DocsChat>
  );
}

function HistoryDemo() {
  const { activeId } = useChatState();
  const actions = useChatActions();
  return (
    <div className="w-64 rounded-2xl border border-border/60 bg-surface p-3">
      <ChatHistoryList activeId={activeId} onSelect={actions.setActive} onNew={actions.newConversation} onRemove={actions.remove} />
    </div>
  );
}

function VoiceDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <DocsChat>
      <Button onClick={() => setOpen(true)}>Abrir el modo voz</Button>
      <ChatVoiceMode open={open} onClose={() => setOpen(false)} onWrite={() => {}} onSend={() => {}} />
    </DocsChat>
  );
}

export const chatComposerEntry = defineEntry({
  id: "chat-composer",
  name: "ChatComposer",
  group: "ai",
  description: {
    es: "La caja de escribir del chat: el borde que recorre y la malla al enfocar, Enter envía y Shift+Enter baja de línea, el «+» con conectores y archivos (⌘U), Voz y el botón de enviar con halo. Encima, chips para arrancar; dentro, el aviso de novedad y la pastilla de contexto.",
    en: "The chat input: moving border and mesh on focus, Enter sends and Shift+Enter breaks the line, the “+” menu with connectors and files (⌘U), Voice and the send button with its halo. Starter chips above; the news banner and context chip inside.",
  },
  importPath: 'import { ChatComposer } from "@/components/chat"',
  sourcePath: "src/components/chat/ChatComposer.tsx",
  status: "beta",
  tags: ["ia", "chat", "formulario"],
  playground: definePlayground({
    controls: {
      news: { type: "boolean", label: "Aviso de novedad", default: true },
      chips: { type: "boolean", label: "Chips de arranque", default: true },
      voice: { type: "boolean", label: "Botón Voz", default: true },
      context: { type: "boolean", label: "Pastilla de contexto", default: false },
      compact: { type: "boolean", label: "Compacto", default: false },
    },
    layout: "center",
    render: (values) => <ComposerDemo news={Boolean(values.news)} chips={Boolean(values.chips)} voice={Boolean(values.voice)} context={Boolean(values.context)} compact={Boolean(values.compact)} />,
    code: (values) => `<ChatComposer
  value={value}
  onChange={setValue}
  onSend={(text, files) => send(text, files)}${values.news ? '\n  news={{ text: "Ya ejecuta acciones en **Selección**.", onOpen: openChangelog }}' : ""}${values.chips ? '\n  chips={["Plan de formación para Ventas", "Evaluaciones vencidas"]}\n  onChip={setValue}' : ""}${values.voice ? "\n  onVoice={openVoiceMode}" : ""}${values.context ? '\n  contextChip="Evaluación de desempeño · Q3"\n  onRemoveContext={clearContext}' : ""}${values.compact ? "\n  compact" : ""}
  connectors={connectors}
  onAddConnectors={openConnectors}
/>`,
  }),
  examples: [],
  props: [
    { name: "value / onChange", type: "string / (value) => void", description: "El texto, controlado." },
    { name: "onSend", type: "(text, files) => void", description: "Con el texto recortado y los archivos; la caja se vacía sola." },
    { name: "news", type: "ChatNews", description: "El aviso «Nuevo» encima del texto, con «Ver qué cambió» y cerrar." },
    { name: "contextChip", type: "string", description: "El objeto sobre el que responde el agente." },
    { name: "connectors / onToggleConnector / onAddConnectors", type: "ChatConnector[] / …", description: "El submenú Conectores del «+», con interruptores." },
    { name: "onVoice", type: "() => void", description: "Sin esto no hay botón Voz." },
    { name: "chips / onChip", type: "string[] / (text) => void", description: "Preguntas para arrancar, encima de la caja." },
    { name: "compact", type: "boolean", default: "false", description: "Una fila, para el pie de un hilo." },
    { name: "maxFiles / maxSizeMb", type: "number", default: "10 / 25", description: "Los límites del adjunto; se muestran en el menú." },
  ],
  guidelines: {
    do: ["Una sola caja por pantalla: es la misma en el panel, en pantalla completa y al volver de la voz.", "Deja el aviso «puede cometer errores» salvo en un pie muy apretado."],
    dont: ["No metas el aviso de novedad en el panel: ahí no cabe; va en la pantalla completa.", "No la uses como buscador: para buscar está GlobalSearch."],
  },
  related: ["chat-thread", "chat-panel", "chat-screen", "chat-voice-mode"],
});

export const chatThreadEntry = defineEntry({
  id: "chat-thread",
  name: "ChatThread",
  group: "ai",
  description: {
    es: "El hilo: las preguntas a la derecha (copiar, editar y reenviar desde ahí) y las respuestas con el destello del agente, que se escriben solas y se pueden detener. Una respuesta trae fuentes, una tarjeta con datos, una pregunta con opciones numeradas, un enlace y las acciones: copiar, útil o no, regenerar, leer en voz alta.",
    en: "The thread: questions on the right (copy, edit and resend from there) and answers with the orb, which type themselves and can be stopped. An answer carries sources, a data card, a numbered-option question, a link and the actions: copy, useful or not, regenerate, read aloud.",
  },
  importPath: 'import { ChatThread, ChatProvider } from "@/components/chat"',
  sourcePath: "src/components/chat/ChatThread.tsx",
  status: "beta",
  tags: ["ia", "chat", "mensajes"],
  examples: [
    {
      id: "seeded",
      title: "Una conversación con todo",
      description: "Fuentes con su detalle al pasar, una tarjeta de barras, las sugerencias para seguir y la fila de acciones. Toca una sugerencia: se envía y responde de ejemplo.",
      layout: "center",
      code: `<ChatProvider value={{ store, backend, user, lang: "es-CO" }}>
  <ChatThread conversation={conversation} />
</ChatProvider>`,
      render: () => (
        <DocsChat seed={[SEED_CONVERSATION]}>
          <ThreadDemo />
        </DocsChat>
      ),
    },
  ],
  props: [
    { name: "conversation", type: "Conversation", description: "La conversación a mostrar (del almacén del ChatProvider)." },
    { name: "onMore", type: "(messageId, action) => void", description: "El menú «Más» de cada respuesta: compartir, crear tarea, reportar." },
  ],
  guidelines: {
    do: ["Deja que el hilo siga el final solo mientras la persona lo mira; si subió a releer, no la muevas.", "Solo la última respuesta enseña sugerencias y deja contestar su pregunta."],
    dont: ["No pongas títulos ni tablas en una respuesta: es un mensaje, no un documento."],
  },
  related: ["chat-composer", "chat-panel", "chat-screen"],
});

export const chatPanelEntry = defineEntry({
  id: "chat-panel",
  name: "ChatPanel",
  group: "ai",
  description: {
    es: "El chat como panel lateral: se porta al ancla de AdminShell (la pantalla se estrecha, no se tapa) y flota a OVERLAY_INSET del borde. Arranca con el saludo, la caja y unas preguntas; con conversación, el hilo arriba y la caja abajo. Desde la cabecera: otra conversación o abrirla en pantalla completa.",
    en: "The chat as a side panel: it portals into the AdminShell anchor (the screen narrows instead of being covered) and floats OVERLAY_INSET from the edge. Starts with the greeting, the box and a few questions; with a conversation, the thread on top and the box below. From the header: a new conversation or open it full screen.",
  },
  importPath: 'import { ChatPanel, ChatProvider } from "@/components/chat"',
  sourcePath: "src/components/chat/ChatPanel.tsx",
  status: "beta",
  tags: ["ia", "chat", "portal", "shell"],
  examples: [
    {
      id: "panel",
      title: "Dentro del shell",
      description: "Sustituye a AiAgentDrawer: mismo ancla, mismo movimiento, pero con conversación de verdad. «Pregúntame» del menú Ayuda abre este panel con el centro de ayuda como fuente.",
      layout: "stretch",
      code: `const [open, setOpen] = React.useState(false);

<ChatProvider value={{ store, backend, user, lang: "es-CO", onOpenFull: openAgentMode, onOpenVoice }}>
  <AdminShell config={config}>
    …
    <ChatPanel open={open} onOpenChange={setOpen} title="Ayuda" />
  </AdminShell>
</ChatProvider>`,
      render: () => <PanelDemo />,
    },
  ],
  props: [
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Abierto o cerrado; Escape cierra." },
    { name: "title / subtitle", type: "string", default: "«Agente IA» / «Asistente de la plataforma»", description: "La cabecera; el chat de ayuda pone «Ayuda»." },
  ],
  guidelines: {
    do: ["Monta un solo ChatProvider en la app: el panel y la pantalla completa comparten conversaciones e historial."],
    dont: ["No abras el panel y el modo agente a la vez: es el mismo chat en dos sitios."],
  },
  related: ["chat-screen", "chat-composer", "chat-thread", "ai-agent-drawer"],
});

export const chatScreenEntry = defineEntry({
  id: "chat-screen",
  name: "ChatScreen",
  group: "ai",
  description: {
    es: "El chat a pantalla completa: lo que AdminShell enseña en modo «Agente IA» cuando la app lo pasa en `config.agentView`. A la izquierda, el historial con «Nuevo chat» (ChatHistoryPanel), que se pliega a una tira; una conversación nueva arranca en el centro con el saludo, la caja y las preguntas de arranque; con hilo, los mensajes ocupan la pantalla y la caja se queda abajo.",
    en: "The full-screen chat: what AdminShell shows in “AI Agent” mode when the app passes it in `config.agentView`. A new conversation starts centered with the greeting, the box and the starter questions; with a thread, the messages fill the screen and the box stays at the bottom. History lives in the sidebar (ChatHistoryList).",
  },
  importPath: 'import { ChatScreen, ChatHistoryList } from "@/components/chat"',
  sourcePath: "src/components/chat/ChatScreen.tsx",
  status: "beta",
  tags: ["ia", "chat", "pantalla", "historial"],
  playground: definePlayground({
    controls: { seeded: { type: "boolean", label: "Con conversación", default: true } },
    layout: "stretch",
    render: (values) => <ScreenDemo key={String(values.seeded)} seeded={Boolean(values.seeded)} />,
    code: () => `// En la app: la pantalla trae su historial, así la barra lateral sigue navegando.
<AdminShell config={{ ...config, agentView: <ChatScreen />, agentSidebar: "navigation", mode, onModeChange }}>`,
  }),
  examples: [
    {
      id: "history",
      title: "El historial",
      description: "Hoy, Ayer, Últimos 7 días y Anteriores; el punto dice si hay respuesta sin leer o si el agente sigue escribiendo. Es lo que el sidebar enseña en modo agente.",
      layout: "center",
      code: `<ChatHistoryList activeId={activeId} onSelect={setActive} onNew={newConversation} onRemove={remove} />`,
      render: () => (
        <DocsChat seed={SEED_HISTORY}>
          <HistoryDemo />
        </DocsChat>
      ),
    },
  ],
  props: [
    { name: "history", type: "boolean", default: "true", description: "El historial a la izquierda, con «Nuevo chat»; se pliega y recuerda cómo lo dejaste." },
    { name: "onMore", type: "(messageId, action) => void", description: "El menú «Más» de cada respuesta." },
  ],
  guidelines: {
    do: ["Con `agentSidebar: \"navigation\"` la barra lateral sigue llevando a las pantallas y el historial vive junto al chat; tocar una pantalla sale del modo agente."],
    dont: ["No hagas una página con ruta para el chat: es un modo del shell, y la URL se queda donde estaba."],
  },
  related: ["chat-panel", "chat-thread", "chat-composer", "admin-shell"],
});

export const chatVoiceModeEntry = defineEntry({
  id: "chat-voice-mode",
  name: "ChatVoiceMode",
  group: "ai",
  description: {
    es: "El modo voz, a pantalla completa y siempre en oscuro: las ondas escuchan con el reconocimiento de voz del navegador, lo dicho se lee grande, y al hacer una pausa llega la respuesta con sus dos botones (el detalle y la primera sugerencia). La píldora de abajo pausa, vuelve a escribir o envía. Sin micrófono lo dice y deja escribir.",
    en: "Voice mode, full screen and always dark: the orb listens through the browser's speech recognition, what you said reads large, and after a pause the answer arrives with its two buttons (the detail and the first follow-up). The pill below pauses, goes back to typing or sends. Without a microphone it says so and lets you type.",
  },
  importPath: 'import { ChatVoiceMode } from "@/components/chat"',
  sourcePath: "src/components/chat/ChatVoiceMode.tsx",
  status: "beta",
  tags: ["ia", "chat", "voz", "diálogo"],
  examples: [
    {
      id: "voice",
      title: "Abrir el modo voz",
      description: "Pide permiso de micrófono la primera vez. En un navegador sin Web Speech enseña el aviso y el botón Escribir.",
      layout: "center",
      code: `<ChatVoiceMode open={open} onClose={close} onWrite={(text) => setDraft(text)} onSend={(text) => send(text)} />`,
      render: () => <VoiceDemo />,
    },
  ],
  props: [
    { name: "open / onClose", type: "boolean / () => void", description: "Abierto o cerrado; Escape cierra." },
    { name: "onWrite", type: "(text) => void", description: "«Escribir»: volver al chat con lo dicho." },
    { name: "onSend", type: "(text) => void", description: "Terminar: lo dicho (o la sugerencia elegida) va al chat." },
  ],
  guidelines: {
    do: ["Usa `lang` del ChatProvider (`es-CO`, `en-US`): es el idioma en que escucha y en que lee en voz alta."],
    dont: ["No lo abras desde el panel en un contenedor angosto sin sitio: es a pantalla completa."],
  },
  related: ["chat-composer", "chat-panel"],
});

function QuestionDemo({ question }: { question: React.ComponentProps<typeof ChatQuestionCard>["question"] }) {
  const [answer, setAnswer] = React.useState<string | undefined>(undefined);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatQuestionCard question={{ ...question, answer }} active onAnswer={setAnswer} />
      {answer && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setAnswer(undefined)}>
          Volver a preguntar
        </Button>
      )}
    </div>
  );
}

export const chatQuestionCardEntry = defineEntry({
  id: "chat-question-card",
  name: "ChatQuestionCard",
  group: "ai",
  description: {
    es: "Una pregunta del agente con opciones numeradas: se contesta tocando, con la tecla del número o escribiendo en «Otro». Con título es una tarjeta completa: la pregunta y su ayuda arriba con la flecha para plegarla, buscador para listas largas, cada opción con descripción y bandera o foto, y varias a la vez con un botón para confirmar. Respondida, se pliega y deja lo elegido.",
    en: "An agent question with numbered options: answered by tapping, by the number key or by typing in “Other”. With a title it's a full card: the question and its hint on top with the arrow to collapse it, a search box for long lists, each option with a description and a flag or photo, and several at once with a button to confirm. Answered, it collapses and keeps what was chosen.",
  },
  importPath: 'import { ChatQuestionCard } from "@/components/chat"',
  sourcePath: "src/components/chat/ChatQuestionCard.tsx",
  status: "beta",
  tags: ["ia", "chat", "pregunta", "opciones", "lista"],
  examples: [
    {
      id: "rich",
      title: "Lista con buscador y descripción",
      description: "La pregunta como título, el buscador y cada opción con su bandera o su descripción. Escribe en el buscador o pulsa un número.",
      layout: "center",
      code: `<ChatQuestionCard
  active
  onAnswer={setAnswer}
  question={{
    title: "¿En qué país quieres buscar prospectos?",
    options: ["Colombia", "México", "Chile", "Argentina", "Brasil", "Perú", "Uruguay"],
    details: { Colombia: { emoji: "🇨🇴" }, México: { emoji: "🇲🇽" } },
    searchPlaceholder: "Buscar país",
  }}
/>`,
      render: () => (
        <QuestionDemo
          question={{
            title: "¿En qué país quieres buscar prospectos?",
            options: ["Colombia", "México", "Chile", "Argentina", "Brasil", "Perú", "Uruguay"],
            details: { Colombia: { emoji: "🇨🇴" }, México: { emoji: "🇲🇽" }, Chile: { emoji: "🇨🇱" }, Argentina: { emoji: "🇦🇷" }, Brasil: { emoji: "🇧🇷" }, Perú: { emoji: "🇵🇪" }, Uruguay: { emoji: "🇺🇾" } },
            searchPlaceholder: "Buscar país",
          }}
        />
      ),
    },
    {
      id: "multiple",
      title: "Varias a la vez y «Otro»",
      description: "Se marcan varias y se confirman con el botón; «Otro» deja escribir la respuesta.",
      layout: "center",
      code: `<ChatQuestionCard question={{ title: "¿Qué te vas a hacer?", hint: "Puedes elegir varios.", options, details, multiple: { confirmLabel: "Continuar" } }} active onAnswer={setAnswer} />`,
      render: () => (
        <QuestionDemo
          question={{
            title: "¿Qué te vas a hacer?",
            hint: "Puedes elegir varios.",
            options: ["Corte clásico", "Arreglo de barba", "Diseño de cejas"],
            details: { "Corte clásico": { description: "30 min · desde US$ 35" }, "Arreglo de barba": { description: "30 min · desde US$ 30" }, "Diseño de cejas": { description: "15 min · desde US$ 12" } },
            multiple: { confirmLabel: "Continuar" },
          }}
        />
      ),
    },
    {
      id: "simple",
      title: "Sin título (en una respuesta del hilo)",
      description: "La forma corta que usa el chat de ayuda: solo las opciones numeradas y «Otro».",
      layout: "center",
      code: `<ChatQuestionCard question={{ options: ["Una", "Dos", "Tres"], otherPlaceholder: "Escribe cuántos" }} active onAnswer={setAnswer} />`,
      render: () => <QuestionDemo question={{ options: ["Una", "Dos", "Tres"], otherPlaceholder: "Escribe cuántos" }} />,
    },
  ],
  props: [
    { name: "question", type: "ChatQuestion", description: "Las opciones y, opcionales: title, hint, details (descripción, emoji o image por opción), searchPlaceholder, multiple { confirmLabel }, otherLabel, otherPlaceholder y answer." },
    { name: "active", type: "boolean", description: "Se puede responder: es la última pregunta de la conversación." },
    { name: "onAnswer", type: "(option: string) => void", description: "La opción elegida; con multiple, las elegidas unidas por « · » (CHAT_MULTIPLE_SEPARATOR)." },
  ],
  guidelines: {
    do: ["Úsala para cada elección dentro de una conversación: es más chat que meter un formulario en el hilo.", "Pon buscador cuando la lista pase de unas ocho opciones.", "Lo que se escribe (un teléfono, un código, un nombre) va en la caja del chat, no en la tarjeta."],
    dont: ["No metas formularios dentro de la tarjeta: para datos sensibles (una tarjeta de pago) abre una hoja aparte.", "No repitas la pregunta en un mensaje y en el título: el título ya es la pregunta."],
  },
  related: ["chat-thread", "chat-composer", "chip"],
});

export const chatEntries = [chatComposerEntry, chatThreadEntry, chatQuestionCardEntry, chatPanelEntry, chatScreenEntry, chatVoiceModeEntry];
