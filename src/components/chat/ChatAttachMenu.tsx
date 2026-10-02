import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Text } from "@/components/typography";
import { useT } from "@/i18n";
import type { ChatConnector } from "./useChat";

export interface ChatAttachMenuProps {
  connectors?: readonly ChatConnector[];
  onToggleConnector?: (id: string, connected: boolean) => void;
  onAddConnectors?: () => void;
  onPickFiles: () => void;
  maxFiles: number;
  maxSizeMb: number;
  disabled?: boolean;
}

function MenuTile({ name }: { name: React.ComponentProps<typeof ThemaIcon>["name"] }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface text-text-secondary">
      <ThemaIcon className="text-current" name={name} size="sm" decorative />
    </span>
  );
}

/**
 * El «+» de la caja: conectores (con su interruptor) y archivos del equipo.
 * El atajo ⌘U lo escucha la caja; aquí solo se enseña.
 */
export function ChatAttachMenu({ connectors, onToggleConnector, onAddConnectors, onPickFiles, maxFiles, maxSizeMb, disabled }: ChatAttachMenuProps) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const hasConnectors = Boolean(connectors && (connectors.length > 0 || onAddConnectors));
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={t("chat.add")}
          title={t("chat.add")}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border border-border/70 bg-surface text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
            open && "border-primary/40 bg-primary/10 text-primary"
          )}
          data-testid="chat-attach"
        >
          <ThemaIcon className="text-current" name="plus" size="sm" decorative />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-72 rounded-xl p-1">
        {hasConnectors && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="items-center gap-3 rounded-lg px-2 py-2">
              <MenuTile name="link" />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-text-primary">{t("chat.connectors")}</span>
                <span className="text-xs text-text-muted">{t("chat.connectorsHint")}</span>
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-64 rounded-xl p-1">
                {onAddConnectors && (
                  <>
                    <DropdownMenuItem onSelect={onAddConnectors} className="gap-2 rounded-lg">
                      <ThemaIcon className="text-current" name="plus" size="xs" decorative />
                      {t("chat.connectorsAdd")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {connectors && connectors.length > 0 && (
                  <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("chat.connectorsConnected")}</DropdownMenuLabel>
                )}
                {connectors?.map((connector) => (
                  <DropdownMenuItem
                    key={connector.id}
                    role="menuitemcheckbox"
                    aria-checked={connector.connected}
                    className="justify-between gap-3 rounded-lg"
                    onSelect={(event) => {
                      // Cambiar un interruptor no cierra el menú: se pueden tocar varios seguidos.
                      event.preventDefault();
                      onToggleConnector?.(connector.id, !connector.connected);
                    }}
                  >
                    <span className="text-sm">{connector.label}</span>
                    <Switch size="sm" checked={connector.connected} tabIndex={-1} aria-hidden className="pointer-events-none" />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        <DropdownMenuItem onSelect={onPickFiles} className="items-center gap-3 rounded-lg px-2 py-2">
          <MenuTile name="attach" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-text-primary">{t("chat.attachFiles")}</span>
            <span className="text-xs text-text-muted">{t("chat.attachFilesHint")}</span>
          </span>
          <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
        </DropdownMenuItem>
        <div className="-mx-1 -mb-1 mt-1 flex items-center gap-2 rounded-b-xl border-t border-border/60 bg-surface-muted/60 px-3 py-2">
          <ThemaIcon name="folderAdd" size="xs" tone="muted" decorative />
          <Text size="xs" tone="muted">
            {t("chat.attachLimits", { files: maxFiles, size: maxSizeMb })}
          </Text>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
