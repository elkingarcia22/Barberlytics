import * as React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/typography"
import { GlassIcon, ThemaIcon } from "@/icons"
import { ACCEPTED_IMAGE_TYPES, MAX_RECORDING_SECONDS, type FeedbackAttachment } from "./useFeedbackAttachments"

export interface FeedbackAttachmentsLabels {
  attachments: string
  emptyTitle: string
  emptyHint: string
  capture: string
  record: string
  upload: string
  remove: (name: string) => string
  recording: string
  stop: string
  video: string
}

interface FeedbackAttachmentsProps {
  attachments: readonly FeedbackAttachment[]
  labels: FeedbackAttachmentsLabels
  /** Sin permiso del navegador para capturar, esos dos botones no se ofrecen. */
  canCapture: boolean
  canRecord: boolean
  disabled: boolean
  isFull: boolean
  error: string | null
  onCapture: () => void
  onRecord: () => void
  onFiles: (files: readonly File[]) => void
  onRemove: (id: string) => void
}

/**
 * La zona de adjuntos del diálogo de feedback: vacía invita a enseñar lo que
 * se ve; con adjuntos los muestra en miniatura y deja las acciones debajo.
 */
export function FeedbackAttachments({
  attachments,
  labels,
  canCapture,
  canRecord,
  disabled,
  isFull,
  error,
  onCapture,
  onRecord,
  onFiles,
  onRemove,
}: FeedbackAttachmentsProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const isBlocked = disabled || isFull

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(event.target.files ?? []))
    // Vaciarlo deja volver a elegir el mismo archivo tras quitarlo.
    event.target.value = ""
  }

  const actions = (
    <div className="flex flex-wrap justify-center gap-2">
      {canCapture && (
        <Button type="button" variant="outline" onClick={onCapture} disabled={isBlocked}>
          <ThemaIcon name="crop" size="sm" /> {labels.capture}
        </Button>
      )}
      {canRecord && (
        <Button type="button" variant="outline" onClick={onRecord} disabled={isBlocked}>
          <ThemaIcon name="video" size="sm" /> {labels.record}
        </Button>
      )}
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isBlocked}>
        <ThemaIcon name="upload" size="sm" /> {labels.upload}
      </Button>
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} multiple hidden onChange={onInputChange} aria-label={labels.upload} />
    </div>
  )

  return (
    <div className="space-y-2">
      <Text as="span" size="sm" weight="medium" className="block">
        {labels.attachments}
      </Text>
      <div className="space-y-4 rounded-xl border border-border/70 p-4">
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center gap-1 pt-2 text-center">
            <GlassIcon name="camera" tone="brand" size={48} className="mb-1" />
            <Text weight="semibold">{labels.emptyTitle}</Text>
            <Text size="sm" tone="secondary" className="max-w-xs">
              {labels.emptyHint}
            </Text>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {attachments.map((item) => (
              <li key={item.id} className="group relative aspect-video overflow-hidden rounded-lg border border-border/60 bg-surface-subtle">
                {item.kind === "image" ? (
                  <img src={item.previewUrl} alt={item.file.name} className="size-full object-cover" />
                ) : (
                  <>
                    <video src={item.previewUrl} muted playsInline preload="metadata" aria-label={item.file.name} className="size-full object-cover" />
                    <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-md bg-foreground/70 px-1.5 py-0.5 text-background">
                      <ThemaIcon name="video" size="xs" tone="inverse" />
                      <Text as="span" size="xs" className="text-background">
                        {labels.video}
                      </Text>
                    </span>
                  </>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={labels.remove(item.file.name)}
                  onClick={() => onRemove(item.id)}
                  disabled={disabled}
                  className="absolute right-1 top-1 shadow-card"
                >
                  <ThemaIcon name="close" size="xs" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {actions}
      </div>
      {error && (
        <Text size="xs" tone="negative" weight="medium" role="alert">
          {error}
        </Text>
      )}
    </div>
  )
}

const pad = (value: number) => String(value).padStart(2, "0")
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`

/**
 * La pastilla que queda a la vista mientras se graba: cuánto va, cuánto queda
 * y cómo parar. El diálogo está apartado, así que esto es todo lo que hay.
 */
export function RecordingPill({ seconds, labels, onStop }: { seconds: number; labels: Pick<FeedbackAttachmentsLabels, "recording" | "stop">; onStop: () => void }) {
  return createPortal(
    <div
      role="status"
      data-slot="recording-pill"
      className="fixed bottom-6 left-1/2 z-toast flex -translate-x-1/2 items-center gap-3 rounded-full border border-border/60 bg-surface py-1.5 pl-4 pr-1.5 shadow-drawer animate-in fade-in slide-in-from-bottom-2 duration-normal motion-reduce:animate-none"
    >
      <span aria-hidden className="size-2.5 rounded-full bg-destructive motion-safe:animate-pulse" />
      <Text as="span" size="sm" weight="medium">
        {labels.recording}
      </Text>
      <Text as="span" size="sm" tone="secondary" tabular>
        {clock(seconds)} / {clock(MAX_RECORDING_SECONDS)}
      </Text>
      <Button type="button" size="sm" variant="destructive" onClick={onStop} className="rounded-full">
        <ThemaIcon name="stop" size="xs" tone="inverse" /> {labels.stop}
      </Button>
    </div>,
    document.body
  )
}
