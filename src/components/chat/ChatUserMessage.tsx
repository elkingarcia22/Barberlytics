import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/typography";
import { useT } from "@/i18n";
import type { ChatMessage } from "@/lib/chat";
import "./chat.css";

export interface ChatUserMessageProps {
  message: ChatMessage;
  /** Corregir el mensaje: lo que venía después se descarta. Sin esto no hay botón. */
  onEdit?: (text: string) => void;
}

function IconAction({ label, name, onClick }: { label: string; name: React.ComponentProps<typeof ThemaIcon>["name"]; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <ThemaIcon className="text-current" name={name} size="xs" decorative />
    </button>
  );
}

/** Lo que dijo la persona: una burbuja a la derecha, con copiar y editar al pasar. */
export function ChatUserMessage({ message, onEdit }: ChatUserMessageProps) {
  const t = useT();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(message.text);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin portapapeles (contexto inseguro): no hay nada que avisar.
    }
  };

  const confirm = () => {
    const text = draft.trim();
    if (!text || text === message.text) {
      setEditing(false);
      return;
    }
    onEdit?.(text);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 self-end" data-testid="chat-user-edit">
        <textarea
          autoFocus
          value={draft}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              confirm();
            }
            if (event.key === "Escape") setEditing(false);
          }}
          aria-label={t("chat.editMessage")}
          className="w-72 max-w-full resize-none rounded-2xl border border-primary/40 bg-surface px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <div className="flex items-center justify-end gap-2">
          <Text size="xs" tone="muted" className="mr-auto">
            {t("chat.editHint")}
          </Text>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" size="sm" onClick={confirm}>
            {t("chat.send")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/user flex max-w-[85%] flex-col items-end gap-1 self-end" data-testid="chat-user">
      <p aria-label={t("chat.yourMessage")} className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5 text-sm text-text-primary">
        {message.text}
      </p>
      <div className={cn("flex items-center gap-0.5 opacity-0 transition-opacity group-hover/user:opacity-100 focus-within:opacity-100")}>
        <IconAction label={copied ? t("chat.copied") : t("chat.copy")} name={copied ? "check" : "copy"} onClick={copy} />
        {onEdit && (
          <IconAction
            label={t("chat.editMessage")}
            name="edit"
            onClick={() => {
              setDraft(message.text);
              setEditing(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
