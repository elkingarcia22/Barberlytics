import * as React from "react";
import { ChatProvider, type ChatContextValue } from "@/components/chat";
import { ShellAgentPanelSlotProvider } from "@/components/app-shell/shellAgentPanelSlot";
import { createChatStore, createDemoBackend, type ChatStore, type Conversation } from "@/lib/chat";

/**
 * Un chat para la doc: almacén sin guardar (cada preview arranca limpio) y
 * las respuestas de ejemplo. Lo que se pasa en `value` pisa lo de aquí.
 */
export function useDocsChat(overrides: Partial<ChatContextValue> = {}, seed?: readonly Conversation[]): ChatContextValue {
  const store = React.useMemo<ChatStore>(() => {
    const created = createChatStore({ persistence: null });
    if (seed) created.setState(() => ({ conversations: [...seed], activeId: seed[0]?.id ?? null }));
    return created;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const backend = React.useMemo(() => createDemoBackend(), []);
  return React.useMemo(
    () => ({
      store,
      backend,
      user: { name: "Carolina Vargas" },
      lang: "es-CO",
      suggestions: ["Plan de formación para Ventas", "Evaluaciones vencidas", "Riesgo de rotación Q3", "Participación de Ventas Bogotá"],
      connectors: [
        { id: "gmail", label: "Gmail", connected: true },
        { id: "slack", label: "Slack", connected: false },
        { id: "drive", label: "Google Drive", connected: true },
      ],
      onAddConnectors: () => {},
      ...overrides,
    }),
    [store, backend, overrides]
  );
}

export function DocsChat({ value, seed, children }: { value?: Partial<ChatContextValue>; seed?: readonly Conversation[]; children: React.ReactNode }) {
  const context = useDocsChat(value, seed);
  return <ChatProvider value={context}>{children}</ChatProvider>;
}

/** Un ancla como la de AdminShell, para que el panel tenga dónde portarse. */
export function DocsPanelHost({ children, content }: { children: React.ReactNode; content?: React.ReactNode }) {
  const [host, setHost] = React.useState<HTMLDivElement | null>(null);
  return (
    <div className="flex h-[560px] w-full gap-2 overflow-hidden rounded-2xl border border-border/60 bg-background p-2">
      <ShellAgentPanelSlotProvider value={host}>
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-card">{content}</div>
        {children}
      </ShellAgentPanelSlotProvider>
      <div ref={setHost} className="relative flex h-full shrink-0" />
    </div>
  );
}
