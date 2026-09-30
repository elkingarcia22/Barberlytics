import * as React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/feedback/Spinner"
import { Heading, Text } from "@/components/typography"
import { ThemaIcon } from "@/icons"
import { cn } from "@/lib/utils"
import { useResetOnChange } from "@/lib/useResetOnChange"

export interface FeedbackSectionOption {
  value: string
  label: string
}

export interface FeedbackValues {
  section: string
  comment: string
}

export interface FeedbackPanelLabels {
  title: string
  description: string
  section: string
  comment: string
  placeholder: string
  cancel: string
  submit: string
  sending: string
  close: string
  done: string
  context: string
  successTitle: string
  successDescription: string
  another: string
  tooShort: (min: number) => string
  genericError: string
}

export interface FeedbackPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Las partes de lo lanzado sobre las que se puede opinar. La primera es la de por defecto. */
  sections: readonly FeedbackSectionOption[]
  defaultSection?: string
  /** Dónde está la persona («Métricas»). Se enseña para que sepa que el comentario va con esa página. */
  context?: string
  /** Envía el comentario. Si la promesa falla, el texto se conserva y se enseña el mensaje del error. */
  onSubmit: (values: FeedbackValues) => Promise<void> | void
  minLength?: number
  maxLength?: number
  labels?: Partial<FeedbackPanelLabels>
  className?: string
}

const DEFAULT_LABELS: FeedbackPanelLabels = {
  title: "Tu opinión importa",
  description: "Ayúdanos a mejorar lo que acabamos de lanzar.",
  section: "Sección a evaluar",
  comment: "Compártenos tus comentarios",
  placeholder: "¿Qué cambiarías, qué falta o qué te sobra?",
  cancel: "Cancelar",
  submit: "Enviar feedback",
  sending: "Enviando…",
  close: "Cerrar el panel de feedback",
  done: "Cerrar",
  context: "Se guardará con la página",
  successTitle: "¡Gracias por tu feedback!",
  successDescription: "Lo leemos junto con el de todo el equipo y lo convertimos en mejoras.",
  another: "Dejar otro comentario",
  tooShort: (min) => `Escribe al menos ${min} caracteres.`,
  genericError: "No se pudo enviar. Tu comentario sigue aquí; inténtalo de nuevo.",
}

type Status = "idle" | "sending" | "sent" | "error"

/**
 * FeedbackPanel
 *
 * El panel flotante donde se deja el feedback: qué parte se evalúa y el
 * comentario. No es un modal —la página sigue a la vista para poder señalar
 * lo que se comenta— y se ancla encima del `FeedbackLauncher`.
 *
 * Guarda el texto si el envío falla y, al acertar, cambia a un agradecimiento
 * desde el que se puede dejar otro comentario sin volver a abrirlo. La página
 * en la que se está (`context`) viaja sola: la persona no tiene que decirla.
 *
 * @example
 * <FeedbackPanel open={open} onOpenChange={setOpen} sections={secciones} context="Métricas" onSubmit={enviar} />
 */
export function FeedbackPanel({
  open,
  onOpenChange,
  sections,
  defaultSection,
  context,
  onSubmit,
  minLength = 5,
  maxLength = 1000,
  labels,
  className,
}: FeedbackPanelProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  const initialSection = defaultSection ?? sections[0]?.value ?? ""
  const [section, setSection] = React.useState(initialSection)
  const [comment, setComment] = React.useState("")
  const [status, setStatus] = React.useState<Status>("idle")
  const [error, setError] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const titleId = React.useId()
  const commentId = React.useId()
  const sectionId = React.useId()
  const errorId = React.useId()

  // Tras un envío correcto, volver a abrir empieza de cero; con un borrador, lo conserva.
  useResetOnChange(String(open), () => {
    if (open && status === "sent") {
      setStatus("idle")
      setComment("")
    }
  })

  React.useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const trimmed = comment.trim()
  const sending = status === "sending"

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (trimmed.length < minLength) {
      setError(text.tooShort(minLength))
      textareaRef.current?.focus()
      return
    }
    setStatus("sending")
    setError(null)
    try {
      await onSubmit({ section, comment: trimmed })
      setStatus("sent")
    } catch (cause) {
      setStatus("error")
      setError(cause instanceof Error && cause.message ? cause.message : text.genericError)
    }
  }

  const startAnother = () => {
    setComment("")
    setStatus("idle")
    window.setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-slot="feedback-panel"
      className={cn(
        "fixed bottom-40 right-4 z-popover flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-premium md:bottom-24 md:right-6",
        "origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-normal ease-out-expo motion-reduce:animate-none",
        className
      )}
    >
      <header className="flex items-start gap-3 border-b border-border/60 bg-primary/10 px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-card">
          <ThemaIcon name="feedback" size="sm" tone="inverse" />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <Heading level={6} id={titleId} weight="semibold">
            {text.title}
          </Heading>
          <Text size="xs" tone="secondary">
            {text.description}
          </Text>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label={text.close} className="-mr-1.5 -mt-1 shrink-0">
          <ThemaIcon name="close" size="sm" tone="muted" />
        </Button>
      </header>

      {status === "sent" ? (
        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center animate-in fade-in zoom-in-95 duration-normal motion-reduce:animate-none" role="status">
          <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
            <ThemaIcon name="success" size="md" tone="positive" />
          </span>
          <Heading level={6} weight="semibold">
            {text.successTitle}
          </Heading>
          <Text tone="secondary" className="max-w-xs">
            {text.successDescription}
          </Text>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={startAnother}>
              {text.another}
            </Button>
            <Button onClick={() => onOpenChange(false)}>{text.done}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5">
          {context && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2">
              <ThemaIcon name="pointer" size="xs" tone="muted" />
              <Text size="xs" tone="secondary" truncate>
                {text.context} <Text as="span" size="xs" weight="semibold">{context}</Text>
              </Text>
            </div>
          )}

          {sections.length > 1 && (
            <div className="space-y-1.5">
              <label htmlFor={sectionId} className="block">
                <Text as="span" variant="small" tone="muted" className="uppercase tracking-wider">
                {text.section}
              </Text>
              </label>
              <Select value={section} onValueChange={setSection} disabled={sending}>
                <SelectTrigger id={sectionId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-popover">
                  {sections.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor={commentId} className="block">
                <Text as="span" variant="small" tone="muted" className="uppercase tracking-wider">
              {text.comment}
            </Text>
              </label>
            <Textarea
              ref={textareaRef}
              id={commentId}
              value={comment}
              maxLength={maxLength}
              onChange={(event) => {
                setComment(event.target.value)
                if (error) setError(null)
              }}
              placeholder={text.placeholder}
              disabled={sending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="min-h-28 resize-none"
            />
            <div className="flex items-start justify-between gap-3">
              {error ? (
                <Text id={errorId} size="xs" tone="negative" weight="medium" role="alert">
                  {error}
                </Text>
              ) : (
                <span />
              )}
              <Text size="xs" tone="muted" tabular className="shrink-0">
                {comment.length}/{maxLength}
              </Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
              {text.cancel}
            </Button>
            <Button type="submit" size="lg" disabled={sending || trimmed.length === 0}>
              {sending ? <Spinner size="sm" tone="inverse" label={text.sending} /> : <ThemaIcon name="send" size="sm" tone="inverse" />}
              {sending ? text.sending : text.submit}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
