import * as React from "react";
import { ClipperOrb, type ClipperOrbState } from "@/components/ai-interaction/ClipperOrb";

export interface ChatMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `xs` 20px para una fila, `sm` 24px junto a un mensaje, `md` 36px en cabeceras, `lg` 56px en el saludo. */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * `still` quieta; `breathing` en reposo (el orbe gira despacio y respira);
   * `thinking` mientras prepara la respuesta (gira rápido y el halo se aviva).
   */
  motion?: "still" | "breathing" | "thinking";
}

const SIZE: Record<NonNullable<ChatMarkProps["size"]>, number> = { xs: 20, sm: 24, md: 36, lg: 56 };
const STATE: Record<NonNullable<ChatMarkProps["motion"]>, ClipperOrbState> = { still: "idle", breathing: "idle", thinking: "thinking" };

/**
 * La marca del agente: el orbe de Clipper. Va donde el agente habla: junto a cada respuesta, en la
 * cabecera del panel y en el saludo. Pequeño (≤ 24 px) va sin halo ni anillo.
 */
export function ChatMark({ size = "sm", motion = "still", className }: ChatMarkProps) {
  return <ClipperOrb size={SIZE[size]} state={STATE[motion]} bare={SIZE[size] <= 24} className={className} />;
}
