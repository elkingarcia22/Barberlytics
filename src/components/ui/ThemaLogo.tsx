import * as React from "react";
import { cn } from "@/lib/utils";

interface ThemaLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Marca neutra del sistema: tres franjas escalonadas que sugieren capas de
 * un tema (fondo, superficie, acento). Monocroma, para que herede el color
 * que le pases y funcione sobre cualquier superficie.
 */
export const ThemaLogo: React.FC<ThemaLogoProps> = ({ className, size = 24, color = "white" }) => {
  return (
    <div className={cn("flex items-center justify-center transition-all duration-300 hover:scale-110", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="3" y="4" width="18" height="4.5" rx="2.25" fill={color} />
        <rect x="6" y="10" width="15" height="4.5" rx="2.25" fill={color} opacity="0.75" />
        <rect x="9" y="16" width="12" height="4.5" rx="2.25" fill={color} opacity="0.5" />
      </svg>
    </div>
  );
};
