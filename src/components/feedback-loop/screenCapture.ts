/**
 * Captura y grabación de pantalla con las API del navegador.
 *
 * Las dos piden permiso con el selector nativo —pestaña, ventana o pantalla—:
 * nada se captura sin que la persona lo elija, y cancelar ese selector no es
 * un error sino un «al final no».
 */

/** Espera a que el selector del navegador se cierre antes de tomar el fotograma. */
const SETTLE_MS = 350;
/** Calidad de sobra para leer una interfaz sin que un minuto pese decenas de megas. */
const VIDEO_BITS_PER_SECOND = 1_500_000;
const RECORDING_MIME_TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"] as const;

/** Un recorte en fracciones (0–1) del fotograma, para no depender de a qué tamaño se enseñó. */
export interface CropFraction {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isScreenCaptureSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function";
}

export function isScreenRecordingSupported(): boolean {
  return isScreenCaptureSupported() && typeof MediaRecorder !== "undefined";
}

/** La persona cerró el selector o negó el permiso: no hay nada que explicarle. */
export function isCaptureCancelled(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "AbortError");
}

function requestDisplay(): Promise<MediaStream> {
  // `preferCurrentTab` (Chromium) ofrece primero esta pestaña, que es casi
  // siempre lo que se quiere enseñar; los demás navegadores lo ignoran.
  const options = { video: true, audio: false, preferCurrentTab: true } as DisplayMediaStreamOptions;
  return navigator.mediaDevices.getDisplayMedia(options);
}

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Un fotograma de lo que la persona elija compartir, como lienzo listo para recortar. */
export async function captureScreenFrame(): Promise<HTMLCanvasElement> {
  const stream = await requestDisplay();
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await wait(SETTLE_MS);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0 || canvas.height === 0) throw new Error("No se pudo leer la pantalla compartida.");
    context.drawImage(video, 0, 0);
    return canvas;
  } finally {
    stopStream(stream);
  }
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Recorta el fotograma y lo devuelve como PNG. */
export function cropFrame(frame: HTMLCanvasElement, crop: CropFraction): Promise<Blob> {
  const x = Math.round(clamp(crop.x) * frame.width);
  const y = Math.round(clamp(crop.y) * frame.height);
  const width = Math.max(1, Math.round(clamp(crop.width) * frame.width));
  const height = Math.max(1, Math.round(clamp(crop.height) * frame.height));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) return Promise.reject(new Error("No se pudo recortar la captura."));
  context.drawImage(frame, x, y, width, height, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    output.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo recortar la captura."))), "image/png");
  });
}

export interface ScreenRecording {
  /** Detiene la grabación y devuelve el video. Llamarla dos veces devuelve el mismo. */
  stop: () => Promise<Blob>;
  /** Avisa si la grabación se corta desde fuera: el botón «Dejar de compartir» del navegador. */
  onEnded: (listener: () => void) => void;
}

/** Empieza a grabar lo que la persona elija compartir. */
export async function startScreenRecording(): Promise<ScreenRecording> {
  const stream = await requestDisplay();
  const mimeType = RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITS_PER_SECOND });
  const chunks: Blob[] = [];
  let listener: (() => void) | null = null;

  const finished = new Promise<Blob>((resolve) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      stopStream(stream);
      resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
    });
  });

  const stop = () => {
    if (recorder.state !== "inactive") recorder.stop();
    return finished;
  };

  stream.getVideoTracks()[0]?.addEventListener("ended", () => {
    void stop();
    listener?.();
  });

  recorder.start();
  return {
    stop,
    onEnded: (next) => {
      listener = next;
    },
  };
}
