export interface ImageCropperLabels {
  area: string
  hint: string
  zoom: string
  zoomIn: string
  zoomOut: string
  rotation: string
  rotateLeft: string
  rotateRight: string
  fit: string
  reset: string
}

export const DEFAULT_IMAGE_CROPPER_LABELS: ImageCropperLabels = {
  area: "Área de recorte",
  hint: "Arrastra para mover. Rueda, pellizco o las teclas + y − para acercar. Flechas para desplazar.",
  zoom: "Zoom",
  zoomIn: "Acercar",
  zoomOut: "Alejar",
  rotation: "Giro fino",
  rotateLeft: "Girar a la izquierda",
  rotateRight: "Girar a la derecha",
  fit: "Encajar entera",
  reset: "Restablecer",
}
