import { useAppT } from "@/app/i18n";
import { AIButton } from "@/components/ai-interaction";
import { useBookingFlow } from "./BookingContext";
import { useSwitchToChat } from "./versionSwitch";

/**
 * «Agenda con Clipper»: el botón de IA (secundario) de la primera pantalla que lleva a Clipper con la voz ya abierta. En monitor
 * dice todo; en celular y tablet, solo el nombre del asistente para que quepa.
 */
export function ChatTrigger({ full: alwaysFull = false }: { /** Con el texto completo aunque no sea monitor (la portada tiene sitio). */ full?: boolean }) {
  const t = useAppT();
  const { layout, touch } = useBookingFlow();
  const switchToChat = useSwitchToChat();
  if (!switchToChat) return null;
  const isWide = layout === "wide";
  const full = t("booking.chat.trigger", { name: t("agent.name") });
  // En tablet y monitor cabe el texto completo; en celular, donde se pida (la agenda deja el espacio).
  const showFull = isWide || touch === "lg" || alwaysFull;
  return (
    <AIButton
      variant="secondary"
      size={isWide || touch === "lg" ? "sm" : "xs"}
      label={showFull ? full : t("agent.name")}
      onClick={switchToChat}
      className="shrink-0"
    />
  );
}
