import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/typography";
import type { ChatCard } from "@/lib/chat";

const TONE: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-text-muted",
};

/** Una tarjeta con datos dentro de una respuesta: barras por categoría o unas cifras. */
export function ChatCardView({ card, className }: { card: ChatCard; className?: string }) {
  if (card.kind === "bars") {
    const max = Math.max(100, ...card.rows.map((row) => row.value));
    return (
      <div className={cn("chat-rise rounded-2xl border border-border/70 bg-surface-muted/50 p-4", className)} data-testid="chat-card">
        <Text size="xs" weight="semibold" tone="muted" className="uppercase tracking-wide">
          {card.title}
        </Text>
        <dl className="mt-3 flex flex-col gap-2.5">
          {card.rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
              <dt className="truncate text-sm text-text-primary">{row.label}</dt>
              <Progress value={(row.value / max) * 100} className="h-1.5" />
              <dd className="text-right text-xs tabular-nums text-text-secondary">{row.display ?? `${row.value}%`}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return (
    <div className={cn("chat-rise rounded-2xl border border-border/70 bg-surface-muted/50 p-4", className)} data-testid="chat-card">
      {card.title && (
        <Text size="xs" weight="semibold" tone="muted" className="mb-3 uppercase tracking-wide">
          {card.title}
        </Text>
      )}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {card.items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-text-muted">{item.label}</dt>
            <dd className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">{item.value}</dd>
            {item.delta && <span className={cn("text-xs", TONE[item.tone ?? "neutral"])}>{item.delta}</span>}
          </div>
        ))}
      </dl>
    </div>
  );
}
