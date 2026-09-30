import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { Kbd } from "@/components/ui/kbd";
import { useT } from "@/i18n";
import type { ChatQuestion } from "@/lib/chat";

export interface ChatQuestionCardProps {
  question: ChatQuestion;
  /** Se puede responder: es la última pregunta y no tiene respuesta. */
  active: boolean;
  onAnswer: (option: string) => void;
}

const MAX_KEYED = 9;

/** Si lo que tiene el foco es un sitio donde se escribe: ahí los números son números. */
function isTyping(): boolean {
  const element = document.activeElement;
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (element as HTMLElement).isContentEditable;
}

/**
 * Una pregunta del agente con opciones numeradas. Se contesta tocando una,
 * pulsando su número (si no se está escribiendo en otro sitio) o con «Otro».
 * Respondida, se queda mostrando lo que se eligió; solo la última pregunta
 * de la conversación se puede contestar.
 */
export function ChatQuestionCard({ question, active, onAnswer }: ChatQuestionCardProps) {
  const t = useT();
  const [other, setOther] = React.useState("");
  const otherRef = React.useRef<HTMLInputElement>(null);
  const options = question.options.slice(0, MAX_KEYED);
  const otherIndex = options.length + 1;
  const answered = question.answer !== undefined;
  const canOther = Boolean(question.otherPlaceholder);

  React.useEffect(() => {
    if (!active || answered) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping()) return;
      const number = Number(event.key);
      if (!Number.isInteger(number) || number < 1) return;
      if (number <= options.length) {
        event.preventDefault();
        onAnswer(options[number - 1]);
      } else if (canOther && number === otherIndex) {
        event.preventDefault();
        otherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, answered, options, canOther, otherIndex, onAnswer]);

  const submitOther = () => {
    const value = other.trim();
    if (!value) return;
    onAnswer(value);
    setOther("");
  };

  const chosenIsOther = answered && !options.includes(question.answer ?? "");

  return (
    <div
      role="group"
      aria-label={t("chat.questionKeyHint")}
      className="chat-rise overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card"
      data-testid="chat-question"
      data-answered={answered || undefined}
    >
      <ol className="divide-y divide-border/60">
        {options.map((option, index) => {
          const chosen = question.answer === option;
          return (
            <li key={option}>
              <button
                type="button"
                disabled={!active || answered}
                onClick={() => onAnswer(option)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:bg-primary/5",
                  active && !answered && "hover:bg-surface-muted",
                  answered && !chosen && "opacity-50",
                  chosen && "bg-primary/5"
                )}
                aria-pressed={chosen || undefined}
              >
                <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">{option}</span>
                {chosen ? <ThemaIcon name="check" size="sm" tone="primary" label={t("chat.questionAnswered")} /> : <Kbd>{index + 1}</Kbd>}
              </button>
            </li>
          );
        })}
        {canOther && (
          <li className={cn("flex flex-col gap-2 px-4 py-3", chosenIsOther && "bg-primary/5")}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">{t("chat.questionOther")}</span>
              {chosenIsOther ? <ThemaIcon name="check" size="sm" tone="primary" label={t("chat.questionAnswered")} /> : <Kbd>{otherIndex}</Kbd>}
            </div>
            {chosenIsOther ? (
              <span className="text-sm text-text-secondary">{question.answer}</span>
            ) : (
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitOther();
                }}
              >
                <input
                  ref={otherRef}
                  value={other}
                  disabled={!active || answered}
                  onChange={(event) => setOther(event.target.value)}
                  placeholder={question.otherPlaceholder}
                  aria-label={t("chat.questionOtherPlaceholder")}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!active || answered || !other.trim()}
                  aria-label={t("chat.send")}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ai-gradient text-text-inverse transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ThemaIcon className="text-current" name="send" size="sm" decorative />
                </button>
              </form>
            )}
          </li>
        )}
      </ol>
    </div>
  );
}
