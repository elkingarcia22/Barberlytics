import { cn } from "@/lib/utils";

export interface BarberPoleProps {
  className?: string;
}

/**
 * El poste de barbería girando: dos remates dorados y un cilindro con las
 * franjas en bucle. Decorativo; el color de la franja de marca viene del tema
 * y el marfil y la tinta son materiales fijos. El alto lo pone el contenedor
 * (`h-64`, `self-stretch`…), el ancho es de 24px.
 */
export function BarberPole({ className }: BarberPoleProps) {
  return (
    <div aria-hidden data-slot="barber-pole" className={cn("flex w-6 flex-col items-stretch gap-1.5", className)}>
      <div className="pole-cap" />
      <div className="pole flex-1" />
      <div className="pole-cap" />
    </div>
  );
}
