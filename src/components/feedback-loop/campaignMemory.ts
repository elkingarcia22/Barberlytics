/**
 * Lo que el navegador recuerda de cada campaña de feedback: si ya se vio el
 * recorrido y si ya se abrió el panel alguna vez. Es comodidad por persona y
 * por navegador —si se pierde, el recorrido vuelve a salir y nada se rompe—,
 * así que todo acceso a `localStorage` va protegido: en una ventana privada o
 * con el almacenamiento bloqueado, simplemente no recuerda.
 */

export type CampaignFlag = "tour" | "opened"

const PREFIX = "thema.feedback"

export function campaignKey(campaignId: string, flag: CampaignFlag): string {
  return `${PREFIX}.${campaignId}.${flag}`
}

export function readCampaignFlag(campaignId: string, flag: CampaignFlag): boolean {
  try {
    return window.localStorage.getItem(campaignKey(campaignId, flag)) === "1"
  } catch {
    return false
  }
}

export function writeCampaignFlag(campaignId: string, flag: CampaignFlag): void {
  try {
    window.localStorage.setItem(campaignKey(campaignId, flag), "1")
  } catch {
    // Sin almacenamiento no hay memoria: el recorrido volverá a ofrecerse.
  }
}
