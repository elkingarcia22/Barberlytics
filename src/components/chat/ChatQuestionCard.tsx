import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Text } from "@/components/typography";
import { useT } from "@/i18n";
import { CHAT_MULTIPLE_SEPARATOR as MULTIPLE_SEPARATOR, type ChatQuestion } from "@/lib/chat";

export interface ChatQuestionCardProps {
  question: ChatQuestion;
  /** Se puede responder: es la última pregunta y no tiene respuesta. */
  active: boolean;
  /** La opción elegida; con `multiple`, las elegidas unidas por « · ». */
  onAnswer: (option: string) => void;
}

const MAX_KEYED = 9;
/** Desde cuántas opciones la lista se recorre por dentro en lugar de crecer. */
const SCROLL_FROM = 6;

/** Si lo que tiene el foco es un sitio donde se escribe: ahí los números son números. */
function isTyping(): boolean {
  const element = document.activeElement;
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (element as HTMLElement).isContentEditable;
}

const plain = (value: string): string => value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const initialsOf = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Una pregunta del agente con opciones numeradas. Se contesta tocando una,
 * pulsando su número (si no se está escribiendo en otro sitio) o con «Otro».
 * Respondida, se queda mostrando lo que se eligió; solo la última pregunta
 * de la conversación se puede contestar.
 *
 * Con `title` es una tarjeta completa: la pregunta arriba con su ayuda y la
 * flecha para plegarla, un buscador si la lista es larga (`searchPlaceholder`),
 * cada opción con su descripción y su bandera o foto (`details`) y, con
 * `multiple`, varias a la vez y un botón para confirmar. Respondida, se pliega
 * y deja a la vista lo elegido.
 */
export function ChatQuestionCard({ question, active, onAnswer }: ChatQuestionCardProps) {
  const t = useT();
  const [other, setOther] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<readonly string[]>([]);
  const otherRef = React.useRef<HTMLInputElement>(null);
  const answered = question.answer !== undefined;
  const [collapsed, setCollapsed] = React.useState(answered && Boolean(question.title));
  const isMultiple = Boolean(question.multiple);
  const isRich = Boolean(question.title);
  const options = isRich ? question.options : question.options.slice(0, MAX_KEYED);
  const otherIndex = options.length + 1;
  const canOther = Boolean(question.otherPlaceholder);
  const answers = answered ? (isMultiple ? (question.answer ?? "").split(MULTIPLE_SEPARATOR) : [question.answer ?? ""]) : [];
  const enabled = active && !answered;
  const visible = query.trim() ? options.filter((option) => plain(`${option} ${question.details?.[option]?.description ?? ""}`).includes(plain(query.trim()))) : options;

  // Al responderse, la tarjeta con título se pliega sola y deja lo elegido.
  const [answeredSeen, setAnsweredSeen] = React.useState(answered);
  if (answered !== answeredSeen) {
    setAnsweredSeen(answered);
    if (answered && isRich) setCollapsed(true);
  }

  const choose = React.useCallback(
    (option: string) => {
      if (!isMultiple) return onAnswer(option);
      setPicked((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]));
    },
    [isMultiple, onAnswer]
  );

  React.useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping()) return;
      const number = Number(event.key);
      if (!Number.isInteger(number) || number < 1 || number > MAX_KEYED) return;
      if (number <= options.length) {
        event.preventDefault();
        choose(options[number - 1]);
      } else if (canOther && number === otherIndex) {
        event.preventDefault();
        otherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, options, canOther, otherIndex, choose]);

  const submitOther = () => {
    const value = other.trim();
    if (!value) return;
    onAnswer(value);
    setOther("");
  };

  const chosenIsOther = answered && answers.some((answer) => !options.includes(answer));

  const list = (
    <ol className={cn("flex flex-col", isRich ? "gap-2" : "divide-y divide-border/60", isRich && options.length > SCROLL_FROM && "max-h-80 overflow-y-auto overscroll-contain pr-1")}>
      {visible.map((option) => {
        const index = options.indexOf(option);
        const chosen = answers.includes(option) || (isMultiple && picked.includes(option));
        const detail = question.details?.[option];
        return (
          <li key={option}>
            <button
              type="button"
              disabled={!enabled}
              onClick={() => choose(option)}
              className={cn(
                "flex w-full items-center gap-3 text-left transition-colors duration-fast ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:transition-none",
                isRich ? "rounded-xl border border-transparent bg-surface-subtle px-3.5 py-3" : "px-4 py-3 focus-visible:bg-primary/5",
                enabled && (isRich ? "hover:border-border hover:bg-surface-muted" : "hover:bg-surface-muted"),
                answered && !chosen && "opacity-50",
                chosen && (isRich ? "border-primary/40 bg-primary/5" : "bg-primary/5")
              )}
              aria-pressed={chosen || undefined}
            >
              {detail?.emoji && (
                <span aria-hidden className="shrink-0">
                  {detail.emoji}
                </span>
              )}
              {detail && "image" in detail && (
                <Avatar size="sm" aria-hidden>
                  {detail.image && <AvatarImage src={detail.image} alt="" />}
                  <AvatarFallback>{initialsOf(option)}</AvatarFallback>
                </Avatar>
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text as="span" size="sm" weight="medium">
                  {option}
                </Text>
                {detail?.description && (
                  <Text as="span" size="xs" tone="secondary">
                    {detail.description}
                  </Text>
                )}
              </span>
              {chosen ? <ThemaIcon name="check" size="sm" tone="primary" label={t("chat.questionAnswered")} /> : index < MAX_KEYED ? <Kbd>{index + 1}</Kbd> : null}
            </button>
          </li>
        );
      })}
      {visible.length === 0 && (
        <li className="px-3.5 py-3">
          <Text size="sm" tone="muted">
            {t("chat.questionNoMatch")}
          </Text>
        </li>
      )}
      {canOther && (
        <li className={cn("flex flex-col gap-2", isRich ? "rounded-xl bg-surface-subtle px-3.5 py-3" : "px-4 py-3", chosenIsOther && "bg-primary/5")}>
          <div className="flex items-center justify-between">
            <Text as="span" size="sm" weight="medium">
              {question.otherLabel ?? t("chat.questionOther")}
            </Text>
            {chosenIsOther ? <ThemaIcon name="check" size="sm" tone="primary" label={t("chat.questionAnswered")} /> : otherIndex <= MAX_KEYED ? <Kbd>{otherIndex}</Kbd> : null}
          </div>
          {chosenIsOther ? (
            <Text as="span" size="sm" tone="secondary">
              {answers.filter((answer) => !options.includes(answer)).join(MULTIPLE_SEPARATOR)}
            </Text>
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
                disabled={!enabled}
                onChange={(event) => setOther(event.target.value)}
                placeholder={question.otherPlaceholder}
                aria-label={question.otherPlaceholder ?? t("chat.questionOtherPlaceholder")}
                className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!enabled || !other.trim()}
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
  );

  if (!isRich) {
    return (
      <div
        role="group"
        aria-label={t("chat.questionKeyHint")}
        className="chat-rise overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card"
        data-testid="chat-question"
        data-answered={answered || undefined}
      >
        {list}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={question.title}
      className="chat-rise flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface p-3 shadow-card"
      data-testid="chat-question"
      data-answered={answered || undefined}
    >
      <div className="flex items-start gap-3 px-1 pt-1">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Text weight="semibold">{question.title}</Text>
          {question.hint && !collapsed && (
            <Text size="xs" tone="secondary">
              {question.hint}
            </Text>
          )}
          {collapsed && answered && (
            <Text size="sm" tone="primary" className="flex items-center gap-1.5">
              <ThemaIcon name="check" size="xs" tone="primary" decorative />
              {question.answer}
            </Text>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("chat.questionExpand") : t("chat.questionCollapse")}
        >
          <ThemaIcon name={collapsed ? "chevronDown" : "chevronUp"} size="xs" />
        </Button>
      </div>
      {!collapsed && (
        <>
          {question.searchPlaceholder && enabled && (
            <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              <ThemaIcon name="search" size="sm" tone="muted" decorative />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={question.searchPlaceholder}
                aria-label={question.searchPlaceholder}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
          )}
          {list}
          {isMultiple && enabled && (
            <Button type="button" disabled={picked.length === 0} onClick={() => onAnswer(picked.join(MULTIPLE_SEPARATOR))}>
              {question.multiple?.confirmLabel}
              {picked.length > 0 && ` · ${picked.length}`}
              <ThemaIcon name="arrowRight" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
