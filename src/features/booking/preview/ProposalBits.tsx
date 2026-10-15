import * as React from "react";
import { Chip } from "@/components/ai-interaction";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PEOPLE } from "./proposalData";

/** «¿Para quién?»: las mismas fichas en todas las propuestas, cada una con su elección propia. */
export function PersonChips({ size = "md" }: { size?: "sm" | "md" }) {
  const [person, setPerson] = React.useState<string>(PEOPLE[0]);
  return (
    <div className="flex flex-wrap gap-2">
      {PEOPLE.map((name) => (
        <Chip key={name} label={name} icon={name === PEOPLE[0] ? "users" : undefined} size={size} selected={person === name} onClick={() => setPerson(name)} />
      ))}
      <Chip label="Otra persona" icon="userAdd" tone="primary" size={size} onClick={() => setPerson(PEOPLE[0])} />
    </div>
  );
}

/** «Juntar todo»: salir del «por separado» (en la propuesta no hace nada). */
export function ExitButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" className={cn("h-7 shrink-0", className)}>
      Juntar todo
    </Button>
  );
}
