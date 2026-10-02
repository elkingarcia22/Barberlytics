import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { ChatMark } from "./ChatMark";
import { greetingKey } from "./greeting";
import "./chat.css";

export interface ChatGreetingProps {
  name: string;
  /** `panel` es más pequeño y sin marca; `screen` lleva el destello grande arriba. */
  variant?: "panel" | "screen";
  className?: string;
}

/** El arranque de una conversación nueva: el destello y «¡Buenos días, Carolina!». */
export function ChatGreeting({ name, variant = "screen", className }: ChatGreetingProps) {
  const t = useT();
  const firstName = name.split(" ")[0] ?? name;
  return (
    <div className={cn("chat-rise flex flex-col items-center text-center", className)}>
      {variant === "screen" && <ChatMark size="lg" motion="breathing" className="mb-6" />}
      <p className={cn("font-semibold tracking-tight text-text-primary", variant === "screen" ? "text-3xl lg:text-4xl" : "text-xl")}>
        <span className="text-ai-gradient">{t(greetingKey())}</span> {firstName}!
      </p>
    </div>
  );
}
