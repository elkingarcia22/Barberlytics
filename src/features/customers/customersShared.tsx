import { useAppT } from "@/app/i18n";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initialsOf } from "@/components/scheduling";
import { SEGMENT_STYLE } from "./customersUtils";
import { SEGMENT_KEYS, type CustomerSegment } from "./types";

/**
 * Las piezas chicas del módulo de clientes: el segmento con su color y su
 * icono, y el avatar. Las ayudas sin JSX viven en `customersUtils.ts`.
 */

export function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const t = useAppT();
  const { icon: Icon, badge } = SEGMENT_STYLE[segment];
  return (
    <Badge variant={badge}>
      <Icon className="size-3" aria-hidden /> {t(SEGMENT_KEYS[segment])}
    </Badge>
  );
}

export function CustomerAvatar({ name, size = "default" }: { name: string; size?: "sm" | "default" | "lg" }) {
  return (
    <Avatar size={size}>
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}
