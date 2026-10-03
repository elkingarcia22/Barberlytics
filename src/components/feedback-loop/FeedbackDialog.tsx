import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Spinner } from "@/components/feedback/Spinner"
import { Text } from "@/components/typography"
import { GlassIcon, ThemaIcon, type IconName } from "@/icons"
import { useResetOnChange } from "@/lib/useResetOnChange"
import { AreaSelector, type AreaSelectorLabels } from "./AreaSelector"
import { FeedbackAttachments, RecordingPill, type FeedbackAttachmentsLabels } from "./FeedbackAttachments"
import { isScreenCaptureSupported, isScreenRecordingSupported } from "./screenCapture"
import { MAX_RECORDING_SECONDS, useFeedbackAttachments, type AttachmentMessages } from "./useFeedbackAttachments"

export interface FeedbackSectionOption {
  value: string
  label: string
}

export type FeedbackType = "improvement" | "bug" | "idea"

export interface FeedbackValues {
  type: FeedbackType
  section: string
  comment: string
  /** Capturas, imágenes subidas y, como mucho, lo que quepa de video. */
  attachments: readonly File[]
  /** La persona dejó marcado que el comentario vaya con la página en la que está. */
  includePage: boolean
  canContact: boolean
}

export interface FeedbackDialogLabels extends FeedbackAttachmentsLabels, AttachmentMessages {
  title: string
  description: string
  type: string
  types: Record<FeedbackType, string>
  placeholders: Record<FeedbackType, string>
  section: string
  comment: string
  includePage: string
  canContact: string
  footnote: string
  cancel: string
  submit: string
  sending: string
  done: string
  successTitle: string
  successDescription: string
  another: string
  tooShort: (min: number) => string
  genericError: string
  selector: Partial<AreaSelectorLabels>
}

export interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Las partes sobre las que se puede opinar. Con una sola no se pregunta. */
  sections?: readonly FeedbackSectionOption[]
  defaultSection?: string
  /** Dónde está la persona («Métricas»). Va con el comentario salvo que lo desmarque. */
  context?: string
  /** Envía el comentario. Si la promesa falla, todo se conserva y se enseña el mensaje del error. */
  onSubmit: (values: FeedbackValues) => Promise<void> | void
  minLength?: number
  maxLength?: number
  labels?: Partial<FeedbackDialogLabels>
}

const TYPES: readonly { value: FeedbackType; icon: IconName }[] = [
  { value: "improvement", icon: "thumbsUp" },
  { value: "bug", icon: "bug" },
  { value: "idea", icon: "idea" },
]

const DEFAULT_LABELS: FeedbackDialogLabels = {
  title: "Enviar feedback",
  description: "Cuéntanos qué funciona bien y qué podemos mejorar.",
  type: "Tipo de feedback",
  types: { improvement: "Mejora", bug: "Error", idea: "Idea" },
  placeholders: {
    improvement: "¿Qué te costó o qué harías distinto? Cuéntanos qué intentabas hacer.",
    bug: "¿Qué pasó y qué esperabas que pasara? Cuéntanos los pasos.",
    idea: "¿Qué te gustaría poder hacer? Cuéntanos para qué lo usarías.",
  },
  section: "Sección a evaluar",
  comment: "Comentario",
  attachments: "Capturas y video (opcional)",
  emptyTitle: "Muéstranos lo que ves",
  emptyHint: `Captura una parte de la pantalla, graba hasta ${MAX_RECORDING_SECONDS} segundos o sube imágenes JPG o PNG de hasta 5 MB.`,
  capture: "Capturar un área",
  record: "Grabar video",
  upload: "Subir imágenes",
  remove: (name) => `Quitar ${name}`,
  recording: "Grabando",
  stop: "Detener",
  video: "Video",
  includePage: "Incluir la página donde estás:",
  canContact: "Pueden contactarme sobre este feedback",
  footnote: "Lo lee el equipo de producto.",
  cancel: "Cancelar",
  submit: "Enviar feedback",
  sending: "Enviando…",
  done: "Cerrar",
  successTitle: "¡Gracias por tu feedback!",
  successDescription: "Lo leemos junto con el de todo el equipo y lo convertimos en mejoras.",
  another: "Dejar otro comentario",
  tooShort: (min) => `Escribe al menos ${min} caracteres.`,
  genericError: "No se pudo enviar. Tu comentario sigue aquí; inténtalo de nuevo.",
  tooMany: (max) => `Puedes adjuntar hasta ${max} archivos.`,
  tooBig: (name) => `${name} pesa más de 5 MB.`,
  wrongType: (name) => `${name} no es una imagen JPG o PNG.`,
  captureFailed: "No se pudo capturar la pantalla. Inténtalo de nuevo o sube una imagen.",
  selector: {},
}

type Status = "idle" | "sending" | "sent" | "error"

/**
 * FeedbackDialog
 *
 * El único sitio donde se deja feedback: lo abre el botón del menú lateral y
 * lo abre el botón de la campaña, y en los dos casos es este mismo diálogo.
 * Pide el tipo, el comentario y, si ayuda, lo que se ve: un recorte de la
 * pantalla, un video corto o imágenes subidas.
 *
 * Mientras se captura o se graba se aparta —lo que hay que enseñar es la
 * página— y vuelve con el adjunto puesto y el texto intacto. Si el envío
 * falla conserva todo; al acertar agradece y deja escribir otro.
 *
 * @example
 * <FeedbackDialog open={open} onOpenChange={setOpen} context="Métricas" onSubmit={enviar} />
 */
export function FeedbackDialog({
  open,
  onOpenChange,
  sections = [],
  defaultSection,
  context,
  onSubmit,
  minLength = 5,
  maxLength = 1000,
  labels,
}: FeedbackDialogProps) {
  const text = React.useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels])
  const [type, setType] = React.useState<FeedbackType>("improvement")
  const [section, setSection] = React.useState(defaultSection ?? sections[0]?.value ?? "")
  const [comment, setComment] = React.useState("")
  const [includePage, setIncludePage] = React.useState(true)
  const [canContact, setCanContact] = React.useState(false)
  const [status, setStatus] = React.useState<Status>("idle")
  const [error, setError] = React.useState<string | null>(null)
  const media = useFeedbackAttachments(text)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const commentId = React.useId()
  const sectionId = React.useId()
  const errorId = React.useId()
  const includeId = React.useId()
  const contactId = React.useId()

  const { clear: clearAttachments } = media
  const startOver = React.useCallback(() => {
    setComment("")
    setStatus("idle")
    setError(null)
    clearAttachments()
  }, [clearAttachments])

  // Tras un envío correcto, volver a abrir empieza de cero; con un borrador, lo conserva.
  useResetOnChange(String(open), () => {
    if (open && status === "sent") {
      setStatus("idle")
      setComment("")
    }
  })
  React.useEffect(() => {
    if (!open && status === "sent") clearAttachments()
  }, [open, status, clearAttachments])

  const trimmed = comment.trim()
  const isSending = status === "sending"
  const isCapturing = media.mode.kind !== "idle"

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
      await onSubmit({
        type,
        section,
        comment: trimmed,
        attachments: media.attachments.map((item) => item.file),
        includePage: includePage && Boolean(context),
        canContact,
      })
      setStatus("sent")
    } catch (cause) {
      setStatus("error")
      setError(cause instanceof Error && cause.message ? cause.message : text.genericError)
    }
  }

  return (
    <>
      <Dialog open={open && !isCapturing} onOpenChange={onOpenChange}>
        <DialogContent data-slot="feedback-dialog" className="flex max-h-[min(calc(100dvh-1.5rem),46rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center" role="status">
              <GlassIcon name="success" tone="green" size={64} className="mb-1" />
              <DialogTitle className="text-lg font-semibold text-text-primary">{text.successTitle}</DialogTitle>
              <DialogDescription className="max-w-xs text-sm text-text-secondary">{text.successDescription}</DialogDescription>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={startOver}>
                  {text.another}
                </Button>
                <Button onClick={() => onOpenChange(false)}>{text.done}</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
              <header className="space-y-1 px-6 pb-3 pt-5 pr-12">
                <DialogTitle className="text-lg font-semibold text-text-primary">{text.title}</DialogTitle>
                <DialogDescription className="text-sm text-text-secondary">{text.description}</DialogDescription>
              </header>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-5 pt-1">
                <div className="space-y-2">
                  <Text as="span" size="sm" weight="medium" className="block">
                    {text.type}
                  </Text>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={type}
                    onValueChange={(next) => next && setType(next as FeedbackType)}
                    aria-label={text.type}
                    disabled={isSending}
                  >
                    {TYPES.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value}>
                        <ThemaIcon name={option.icon} size="sm" /> {text.types[option.value]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {sections.length > 1 && (
                  <div className="space-y-2">
                    <label htmlFor={sectionId} className="block">
                      <Text as="span" size="sm" weight="medium">
                        {text.section}
                      </Text>
                    </label>
                    <Select value={section} onValueChange={setSection} disabled={isSending}>
                      <SelectTrigger id={sectionId} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {sections.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor={commentId} className="block">
                    <Text as="span" size="sm" weight="medium">
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
                    placeholder={text.placeholders[type]}
                    disabled={isSending}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className="min-h-24 resize-y"
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

                <FeedbackAttachments
                  attachments={media.attachments}
                  labels={text}
                  canCapture={isScreenCaptureSupported()}
                  canRecord={isScreenRecordingSupported()}
                  disabled={isSending}
                  isFull={media.isFull}
                  error={media.error}
                  onCapture={() => void media.startCapture()}
                  onRecord={() => void media.startRecording()}
                  onFiles={media.addFiles}
                  onRemove={media.remove}
                />

                <div className="space-y-3 border-t border-border/60 pt-4">
                  {context && (
                    <div className="flex items-start gap-2.5">
                      <Checkbox id={includeId} checked={includePage} onCheckedChange={(value) => setIncludePage(value === true)} disabled={isSending} className="mt-0.5" />
                      <label htmlFor={includeId}>
                        <Text as="span" size="sm">
                          {text.includePage}{" "}
                          <Text as="span" size="sm" weight="semibold">
                            {context}
                          </Text>
                        </Text>
                      </label>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <Checkbox id={contactId} checked={canContact} onCheckedChange={(value) => setCanContact(value === true)} disabled={isSending} className="mt-0.5" />
                    <label htmlFor={contactId}>
                      <Text as="span" size="sm">
                        {text.canContact}
                      </Text>
                    </label>
                  </div>
                </div>
              </div>

              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-surface-subtle px-6 py-3">
                <Text size="sm" tone="secondary" className="mr-auto">
                  {text.footnote}
                </Text>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                  {text.cancel}
                </Button>
                <Button type="submit" disabled={isSending || trimmed.length === 0}>
                  {isSending && <Spinner size="sm" tone="inverse" label={text.sending} />}
                  {isSending ? text.sending : text.submit}
                </Button>
              </footer>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {media.mode.kind === "selecting" && (
        <AreaSelector frame={media.mode.frame} onConfirm={(crop) => void media.confirmCapture(crop)} onCancel={media.cancelCapture} labels={text.selector} />
      )}
      {media.mode.kind === "recording" && <RecordingPill seconds={media.mode.seconds} labels={text} onStop={() => void media.stopRecording()} />}
    </>
  )
}
