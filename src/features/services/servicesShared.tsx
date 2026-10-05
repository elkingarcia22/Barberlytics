import { Globe, Layers, Lock, Scissors } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/utility";
import { VISIBILITY_KEYS, type ServiceKind, type Visibility } from "./types";

/** Las piezas chicas del módulo de servicios: el icono por tipo y las insignias de estado y de reserva. */

/** La foto del servicio y, mientras no hay o no carga, el icono de su tipo. */
export function ServiceGlyph({ kind, size = "md", imageUrl }: { kind: ServiceKind; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  return <IconTile icon={kind === "combo" ? <Layers /> : <Scissors />} tone={kind === "combo" ? "primary" : "neutral"} size={size} src={imageUrl} />;
}

export function ActiveBadge({ active }: { active: boolean }) {
  const t = useAppT();
  return <StatusBadge status={active ? "active" : "inactive"} label={t(active ? "services.status.active" : "services.status.inactive")} />;
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const t = useAppT();
  const Icon = visibility === "public" ? Globe : Lock;
  return (
    <Badge variant={visibility === "public" ? "info" : "neutral"}>
      <Icon className="size-3" aria-hidden /> {t(VISIBILITY_KEYS[visibility])}
    </Badge>
  );
}
