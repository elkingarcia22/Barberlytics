import * as React from "react"
import { FeedbackLauncher } from "./FeedbackLauncher"
import { FeedbackPanel, type FeedbackPanelLabels, type FeedbackSectionOption, type FeedbackValues } from "./FeedbackPanel"
import { GuidedTour, type GuidedTourLabels, type TourStep } from "./GuidedTour"
import { useResetOnChange } from "@/lib/useResetOnChange"
import { readCampaignFlag, writeCampaignFlag } from "./campaignMemory"

/** El selector con el que un paso del recorrido apunta al botón de feedback. */
export const FEEDBACK_LAUNCHER_TARGET = '[data-tour="feedback-launcher"]'

export interface FeedbackCampaignConfig {
  /** Estable y único: separa las respuestas en la hoja y lo que recuerda el navegador. */
  id: string
  /** Lo que se lanzó, tal como se leerá en el resumen («Nuevo inicio»). */
  name: string
  /** Las partes sobre las que se opina. */
  sections: readonly FeedbackSectionOption[]
  /** El recorrido de presentación. Vacío = sin recorrido, solo el botón. */
  tour?: readonly TourStep[]
}

export interface FeedbackCampaignProps {
  campaign: FeedbackCampaignConfig
  /** Dónde está la persona ahora; va con cada comentario. */
  context?: string
  onSubmit: (values: FeedbackValues) => Promise<void> | void
  /** El recorrido arranca solo la primera vez. `false` para lanzarlo a mano con `startTourRef`. */
  autoStartTour?: boolean
  /** Espera antes del recorrido automático, para que la pantalla termine de pintarse. */
  tourDelayMs?: number
  /** Recibe una función que vuelve a lanzar el recorrido (p. ej. desde un menú de ayuda). */
  startTourRef?: React.Ref<(() => void) | null>
  panelLabels?: Partial<FeedbackPanelLabels>
  tourLabels?: Partial<GuidedTourLabels>
}

const DEFAULT_TOUR_DELAY_MS = 700

/**
 * FeedbackCampaign
 *
 * El circuito completo para pedir feedback masivo sobre algo que se acaba de
 * lanzar: el recorrido guiado que lo presenta la primera vez, el botón
 * flotante que queda en todas las páginas y el panel donde se escribe.
 *
 * Recuerda por campaña —en el navegador— si ya se vio el recorrido y si ya se
 * abrió el panel: el recorrido no se repite y el botón, una vez usado, se
 * contrae a icono y deja de latir. Una campaña nueva (otro `id`) empieza de
 * cero.
 *
 * El envío es del contenedor: `onSubmit` recibe sección y comentario, y la
 * página y la campaña las añade quien lo monta.
 *
 * @example
 * <FeedbackCampaign campaign={campana} context="Métricas" onSubmit={enviar} />
 */
export function FeedbackCampaign({
  campaign,
  context,
  onSubmit,
  autoStartTour = true,
  tourDelayMs = DEFAULT_TOUR_DELAY_MS,
  startTourRef,
  panelLabels,
  tourLabels,
}: FeedbackCampaignProps) {
  const steps = campaign.tour ?? []
  const [tourOpen, setTourOpen] = React.useState(false)
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [opened, setOpened] = React.useState(() => readCampaignFlag(campaign.id, "opened"))

  useResetOnChange(campaign.id, () => setOpened(readCampaignFlag(campaign.id, "opened")))

  React.useEffect(() => {
    if (!autoStartTour || steps.length === 0 || readCampaignFlag(campaign.id, "tour")) return
    const timer = window.setTimeout(() => setTourOpen(true), tourDelayMs)
    return () => window.clearTimeout(timer)
  }, [campaign.id, autoStartTour, steps.length, tourDelayMs])

  React.useImperativeHandle<(() => void) | null, (() => void) | null>(
    startTourRef,
    () => (steps.length > 0 ? () => setTourOpen(true) : null),
    [steps.length]
  )

  // Cerrar el recorrido, se complete o no, cuenta como visto: no se insiste.
  const onTourOpenChange = (open: boolean) => {
    setTourOpen(open)
    if (!open) writeCampaignFlag(campaign.id, "tour")
  }

  const togglePanel = () => {
    if (tourOpen) onTourOpenChange(false)
    setPanelOpen((value) => !value)
    if (!opened) {
      setOpened(true)
      writeCampaignFlag(campaign.id, "opened")
    }
  }

  return (
    <>
      <FeedbackLauncher
        data-tour="feedback-launcher"
        collapsed={opened}
        highlight={!opened && !tourOpen}
        expanded={panelOpen}
        onClick={togglePanel}
      />
      <FeedbackPanel
        key={campaign.id}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        sections={campaign.sections}
        context={context}
        onSubmit={onSubmit}
        labels={panelLabels}
      />
      {steps.length > 0 && <GuidedTour steps={steps} open={tourOpen} onOpenChange={onTourOpenChange} labels={tourLabels} />}
    </>
  )
}
