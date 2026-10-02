import * as React from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { useActiveConversation, useChatActions, useChatContext } from "./useChat";
import { ChatComposer } from "./ChatComposer";
import { ChatThread } from "./ChatThread";
import { ChatGreeting } from "./ChatGreeting";
import { ChatHistoryPanel } from "./ChatHistoryPanel";

export interface ChatScreenProps {
  /** El historial al lado, con «Nuevo chat». Apágalo si la app lo enseña en otro sitio. */
  history?: boolean;
  /** El «Más» de cada respuesta. */
  onMore?: (messageId: string, action: "share" | "task" | "report") => void;
  className?: string;
}

/**
 * El chat a pantalla completa: lo que enseña el modo «Agente IA» del shell.
 * Una conversación nueva arranca en el centro, con el saludo, la caja y las
 * preguntas de arranque; con hilo, los mensajes ocupan la pantalla y la
 * caja se queda abajo. A la izquierda, el historial con «Nuevo chat», que
 * se pliega para dejarle todo el ancho al hilo.
 */
export function ChatScreen({ history = true, onMore, className }: ChatScreenProps) {
  const t = useT();
  const { user, suggestions, connectors, onToggleConnector, onAddConnectors, news, onOpenVoice } = useChatContext();
  const conversation = useActiveConversation();
  const actions = useChatActions();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = React.useState("");
  const hasThread = Boolean(conversation && conversation.messages.length > 0);

  // Cambiar de conversación devuelve el cursor a la caja.
  React.useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?.id]);

  const composerProps = {
    value: draft,
    onChange: setDraft,
    onSend: (text: string) => actions.send(text),
    inputRef,
    news,
    connectors,
    onToggleConnector,
    onAddConnectors,
    onVoice: onOpenVoice,
  };

  const main =
    hasThread && conversation ? (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="mx-auto w-full max-w-3xl py-6">
            <ChatThread conversation={conversation} onMore={onMore} />
          </div>
        </div>
        <div className="shrink-0 px-4 pb-4 pt-2 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <ChatComposer {...composerProps} placeholder={t("chat.placeholder.followup")} />
          </div>
        </div>
      </div>
    ) : (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col py-8">
          <ChatGreeting name={user.name} className="mb-8" />
          {/* Las preguntas de arranque van como chips encima de la caja: se leen de un vistazo y se tocan una vez. */}
          <ChatComposer {...composerProps} autoFocus chips={suggestions} onChip={(chip) => actions.send(chip)} />
        </div>
      </div>
    );

  return (
    <div className={cn("flex h-full min-h-0", className)} data-testid="chat-screen">
      {history && <ChatHistoryPanel />}
      {main}
    </div>
  );
}
