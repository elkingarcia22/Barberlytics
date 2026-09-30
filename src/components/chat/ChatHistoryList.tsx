import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { useT } from "@/i18n";
import { groupConversations, type Conversation, type ConversationGroupKey } from "@/lib/chat";
import { useChatState } from "./useChat";
import "./chat.css";

const GROUP_KEY: Record<ConversationGroupKey, "chat.history.today" | "chat.history.yesterday" | "chat.history.week" | "chat.history.older"> = {
  today: "chat.history.today",
  yesterday: "chat.history.yesterday",
  week: "chat.history.week",
  older: "chat.history.older",
};

function isThinking(conversation: Conversation): boolean {
  return conversation.messages.at(-1)?.status === "pending";
}

/** Un punto que dice si hay respuesta sin leer o si el agente sigue escribiendo. */
export function ChatStatusDot({ conversation }: { conversation: Conversation }) {
  const t = useT();
  if (isThinking(conversation)) {
    return <span aria-label={t("chat.status.thinking")} role="img" className="size-2.5 shrink-0 rounded-full bg-ai-gradient animate-pulse motion-reduce:animate-none" />;
  }
  if (conversation.unread) {
    return <span aria-label={t("chat.status.unread")} role="img" className="size-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />;
  }
  return <span aria-hidden className="size-2 shrink-0 rounded-full border border-border" />;
}

export interface ChatHistoryListProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove?: (id: string) => void;
  className?: string;
}

/**
 * Las conversaciones por cuándo se tocaron, con «Nueva conversación» arriba.
 * Es lo que la barra lateral enseña en modo agente y lo que abre el
 * historial del panel.
 */
export function ChatHistoryList({ activeId, onSelect, onNew, onRemove, className }: ChatHistoryListProps) {
  const t = useT();
  const { conversations } = useChatState();
  const groups = React.useMemo(() => groupConversations(conversations), [conversations]);

  return (
    <nav aria-label={t("chat.history")} className={cn("flex flex-col gap-1", className)} data-testid="chat-history">
      <button
        type="button"
        onClick={onNew}
        className={cn(
          "mb-2 flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:bg-surface-muted hover:text-primary",
          activeId === null && "border-primary/50 text-primary"
        )}
      >
        <ThemaIcon className="text-current" name="plus" size="xs" decorative />
        {t("chat.newConversation")}
      </button>
      {groups.length === 0 && (
        <p className="px-2 py-3 text-xs text-text-muted">{t("chat.history.empty")}</p>
      )}
      {groups.map((group) => (
        <React.Fragment key={group.key}>
          <div className="shrink-0 px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{t(GROUP_KEY[group.key])}</div>
          {group.items.map((conversation) => {
            const active = conversation.id === activeId;
            return (
              <div key={conversation.id} className="group/row relative flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                    active && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary",
                    conversation.unread && !active && "text-text-primary"
                  )}
                >
                  <ChatStatusDot conversation={conversation} />
                  <span className="truncate">{conversation.title}</span>
                </button>
                {onRemove && (
                  <button
                    type="button"
                    aria-label={t("chat.deleteConversation")}
                    title={t("chat.deleteConversation")}
                    onClick={() => onRemove(conversation.id)}
                    className="absolute right-1 flex size-6 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-destructive focus-visible:opacity-100 group-hover/row:opacity-100"
                  >
                    <ThemaIcon className="text-current" name="close" size="xs" decorative />
                  </button>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </nav>
  );
}
