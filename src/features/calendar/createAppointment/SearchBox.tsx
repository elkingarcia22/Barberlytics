import { Input } from "@/components/ui/input";
import { ThemaIcon } from "@/icons";

/** El buscador de «Crear cita» con la cara de la reserva: lupa a la izquierda, a todo lo ancho. */
export function SearchBox({ value, onChange, placeholder, autoFocus, testId }: { value: string; onChange: (value: string) => void; placeholder: string; autoFocus?: boolean; testId?: string }) {
  return (
    <div className="relative">
      <ThemaIcon name="search" size="sm" tone="muted" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
      <Input type="search" autoFocus={autoFocus} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-9" data-testid={testId} />
    </div>
  );
}
