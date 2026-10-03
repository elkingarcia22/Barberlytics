import * as React from "react"
import {
  captureScreenFrame,
  cropFrame,
  isCaptureCancelled,
  startScreenRecording,
  type CropFraction,
  type ScreenRecording,
} from "./screenCapture"

export const MAX_ATTACHMENTS = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_RECORDING_SECONDS = 60
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"] as const

export interface FeedbackAttachment {
  id: string
  kind: "image" | "video"
  file: File
  /** URL local para la miniatura; se libera al quitar el adjunto. */
  previewUrl: string
}

/**
 * En qué anda la captura. Mientras no es `idle` el diálogo se aparta: lo que
 * se quiere enseñar es la página, y el diálogo la taparía.
 */
export type CaptureMode =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "selecting"; frame: HTMLCanvasElement }
  | { kind: "recording"; seconds: number }

export interface AttachmentMessages {
  tooMany: (max: number) => string
  tooBig: (name: string) => string
  wrongType: (name: string) => string
  captureFailed: string
}

const IDLE: CaptureMode = { kind: "idle" }

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function toAttachment(file: File, kind: FeedbackAttachment["kind"]): FeedbackAttachment {
  return { id: newId(), kind, file, previewUrl: URL.createObjectURL(file) }
}

/**
 * Los adjuntos de un comentario: capturas recortadas, un video de la pantalla
 * e imágenes subidas. Lleva también el estado de la captura en curso, porque
 * es lo que decide si el diálogo se ve o se aparta.
 */
export function useFeedbackAttachments(messages: AttachmentMessages) {
  const [attachments, setAttachments] = React.useState<readonly FeedbackAttachment[]>([])
  const [mode, setMode] = React.useState<CaptureMode>(IDLE)
  const [error, setError] = React.useState<string | null>(null)
  const recording = React.useRef<ScreenRecording | null>(null)
  const latest = React.useRef(attachments)

  React.useEffect(() => {
    latest.current = attachments
  }, [attachments])

  // Al desmontar se sueltan las URL locales y cualquier grabación a medias.
  React.useEffect(
    () => () => {
      latest.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      void recording.current?.stop()
    },
    []
  )

  const isFull = attachments.length >= MAX_ATTACHMENTS

  const add = React.useCallback((next: readonly FeedbackAttachment[]) => {
    setAttachments((current) => [...current, ...next].slice(0, MAX_ATTACHMENTS))
  }, [])

  const remove = React.useCallback((id: string) => {
    setAttachments((current) => {
      current.filter((item) => item.id === id).forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return current.filter((item) => item.id !== id)
    })
  }, [])

  const clear = React.useCallback(() => {
    setAttachments((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
    setError(null)
  }, [])

  const fail = React.useCallback(
    (cause: unknown) => {
      setMode(IDLE)
      if (!isCaptureCancelled(cause)) setError(messages.captureFailed)
    },
    [messages.captureFailed]
  )

  const addFiles = React.useCallback(
    (files: readonly File[]) => {
      setError(null)
      const room = MAX_ATTACHMENTS - latest.current.length
      const accepted: FeedbackAttachment[] = []
      for (const file of files) {
        if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
          setError(messages.wrongType(file.name))
        } else if (file.size > MAX_IMAGE_BYTES) {
          setError(messages.tooBig(file.name))
        } else if (accepted.length >= room) {
          setError(messages.tooMany(MAX_ATTACHMENTS))
        } else {
          accepted.push(toAttachment(file, "image"))
        }
      }
      add(accepted)
    },
    [add, messages]
  )

  const startCapture = React.useCallback(async () => {
    setError(null)
    setMode({ kind: "requesting" })
    try {
      setMode({ kind: "selecting", frame: await captureScreenFrame() })
    } catch (cause) {
      fail(cause)
    }
  }, [fail])

  const confirmCapture = React.useCallback(
    async (crop: CropFraction) => {
      if (mode.kind !== "selecting") return
      try {
        const blob = await cropFrame(mode.frame, crop)
        add([toAttachment(new File([blob], `captura-${stamp()}.png`, { type: "image/png" }), "image")])
        setMode(IDLE)
      } catch (cause) {
        fail(cause)
      }
    },
    [mode, add, fail]
  )

  const stopRecording = React.useCallback(async () => {
    const active = recording.current
    if (!active) return
    recording.current = null
    const blob = await active.stop()
    const extension = blob.type.includes("mp4") ? "mp4" : "webm"
    // El grabador entrega `video/webm;codecs=vp9`; el archivo se queda con el tipo a secas.
    const type = blob.type.split(";")[0] || "video/webm"
    if (blob.size > 0) add([toAttachment(new File([blob], `grabacion-${stamp()}.${extension}`, { type }), "video")])
    setMode(IDLE)
  }, [add])

  const startRecording = React.useCallback(async () => {
    setError(null)
    setMode({ kind: "requesting" })
    try {
      const active = await startScreenRecording()
      recording.current = active
      active.onEnded(() => void stopRecording())
      setMode({ kind: "recording", seconds: 0 })
    } catch (cause) {
      fail(cause)
    }
  }, [fail, stopRecording])

  // El reloj de la grabación, con su tope: un video sin fin no se puede enviar.
  const isRecording = mode.kind === "recording"
  React.useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => {
      setMode((current) => (current.kind === "recording" ? { kind: "recording", seconds: current.seconds + 1 } : current))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  const hasReachedLimit = mode.kind === "recording" && mode.seconds >= MAX_RECORDING_SECONDS
  React.useEffect(() => {
    if (hasReachedLimit) void stopRecording()
  }, [hasReachedLimit, stopRecording])

  return {
    attachments,
    mode,
    error,
    isFull,
    addFiles,
    remove,
    clear,
    startCapture,
    confirmCapture,
    cancelCapture: React.useCallback(() => setMode(IDLE), []),
    startRecording,
    stopRecording,
  }
}
