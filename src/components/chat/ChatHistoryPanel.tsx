import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { useT } from "@/i18n";
import { useChatActions, useChatState } from "./useChat";
import { ChatHistoryList } from "./ChatHistoryList";

/** Abierto o plegado se recuerda en este navegador: es una comodidad de cada persona. */
const STORAGE_KEY = "thema-chat-history-open";

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeOpen(open: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    // Sin almacenamiento: se pliega igual, solo que no se recuerda.
  }
}

export interface ChatHistoryPanelProps {
  className?: string;
}

/**
 * El historial al lado del chat a pantalla completa: «Nuevo chat» arriba y
 * las conversaciones por día. Se pliega a una tira con los mismos dos
 * botones (ver el historial, empezar otro) para dejarle todo el ancho al
 * hilo; en pantallas angostas empieza plegado.
 */
export function ChatHistoryPanel({ className }: ChatHistoryPanelProps) {
  const t = useT();
  const { activeId } = useChatState();
  const actions = useChatActions();
  const [open, setOpen] = React.useState(() => (typeof window === "undefined" ? true : readOpen() && window.innerWidth >= 768));

  const toggle = () => {
    setOpen((value) => {
      writeOpen(!value);
      return !value;
    });
  };

  if (!open) {
    return (
      <div className={cn("flex shrink-0 flex-col items-center gap-2 border-r border-border/40 px-2 py-4", className)} data-testid="chat-history-panel" data-open="false">
        <Button type="button" variant="ghost" size="icon-sm" onClick={toggle} aria-label={t("chat.historyExpand")} title={t("chat.historyExpand")} aria-expanded={false}>
          <ThemaIcon className="text-current" name="clock" size="sm" decorative />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={actions.newConversation} aria-label={t("chat.newConversation")} title={t("chat.newConversation")}>
          <ThemaIcon className="text-current" name="plus" size="sm" decorative />
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label={t("chat.history")}
      className={cn("flex w-72 shrink-0 flex-col border-r border-border/40 bg-surface/40 backdrop-blur-sm", className)}
      data-testid="chat-history-panel"
      data-open="true"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
        <Text size="sm" weight="semibold">
          {t("chat.history")}
        </Text>
        <Button type="button" variant="ghost" size="icon-sm" onClick={toggle} aria-label={t("chat.historyCollapse")} title={t("chat.historyCollapse")} aria-expanded>
          <ThemaIcon className="text-current" name="chevronLeft" size="sm" decorative />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <ChatHistoryList activeId={activeId} onSelect={actions.setActive} onNew={actions.newConversation} onRemove={actions.remove} />
      </div>
    </aside>
  );
}
