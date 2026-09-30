import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FeedbackCampaign, type FeedbackCampaignConfig } from "./FeedbackCampaign"
import { campaignKey } from "./campaignMemory"

const CAMPAIGN: FeedbackCampaignConfig = {
  id: "prueba",
  name: "Prueba",
  sections: [{ value: "general", label: "General" }],
  tour: [{ id: "a", title: "Hola", description: "Bienvenida" }],
}

describe("FeedbackCampaign", () => {
  test("la primera vez lanza el recorrido y lo recuerda al cerrarlo", async () => {
    const user = userEvent.setup()
    render(<FeedbackCampaign campaign={CAMPAIGN} onSubmit={vi.fn()} tourDelayMs={0} />)
    expect(await screen.findByRole("dialog", { name: "Hola" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cerrar el recorrido" }))
    expect(window.localStorage.getItem(campaignKey("prueba", "tour"))).toBe("1")
  })

  test("con el recorrido ya visto no lo repite", async () => {
    window.localStorage.setItem(campaignKey("prueba", "tour"), "1")
    render(<FeedbackCampaign campaign={CAMPAIGN} onSubmit={vi.fn()} tourDelayMs={0} />)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(screen.queryByRole("dialog", { name: "Hola" })).not.toBeInTheDocument()
  })

  test("el botón abre el panel y, usado una vez, se contrae a icono", async () => {
    const user = userEvent.setup()
    render(<FeedbackCampaign campaign={CAMPAIGN} onSubmit={vi.fn()} autoStartTour={false} />)
    const launcher = screen.getByRole("button", { name: "Feedback" })
    expect(launcher).toHaveTextContent("Feedback")
    await user.click(launcher)
    expect(screen.getByRole("dialog", { name: "Tu opinión importa" })).toBeInTheDocument()
    expect(launcher).toHaveAttribute("aria-expanded", "true")
    expect(launcher).toHaveAttribute("aria-label", "Feedback")
    expect(window.localStorage.getItem(campaignKey("prueba", "opened"))).toBe("1")
  })
})
