import * as React from "react";
import { TimeSlotGroups, type TimeSlotGroup } from "@/components/scheduling";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { defineEntry, definePlayground } from "../types";
import { ValueReadout } from "../date/_shared";

const faces = (initials: readonly string[]) => (
  <AvatarGroup aria-hidden>
    {initials.map((item) => (
      <Avatar key={item} size="sm">
        <AvatarFallback>{item}</AvatarFallback>
      </Avatar>
    ))}
  </AvatarGroup>
);

const GROUPS = (withFaces: boolean, picked: string | null): TimeSlotGroup[] => [
  {
    id: "morning",
    label: "Mañana",
    options: [
      { time: "09:00", label: "9:00 a. m.", trailing: withFaces ? faces(["EA", "SP"]) : undefined },
      { time: "09:30", label: "9:30 a. m.", trailing: withFaces ? faces(["EA"]) : undefined },
      { time: "10:00", label: "10:00 a. m.", disabled: true },
    ],
  },
  {
    id: "afternoon",
    label: "Tarde",
    options: [
      { time: "14:00", label: "2:00 p. m.", trailing: withFaces ? faces(["SP"]) : undefined },
      { time: "14:30", label: "2:30 p. m.", trailing: withFaces ? faces(["EA", "SP", "AB"]) : undefined },
    ],
  },
].map((group) => ({ ...group, options: group.options.map((option) => ({ ...option, selected: option.time === picked })) }));

function PlaygroundDemo({ size, withFaces }: { size: "default" | "lg"; withFaces: boolean }) {
  const [picked, setPicked] = React.useState<string | null>("09:30");
  return (
    <div className="w-full max-w-md space-y-3">
      <TimeSlotGroups groups={GROUPS(withFaces, picked)} onPick={setPicked} size={size} />
      <ValueReadout label="Hora" value={picked ?? "—"} />
    </div>
  );
}

export const timeSlotGroupsEntry = defineEntry({
  id: "time-slot-groups",
  name: "TimeSlotGroups",
  group: "scheduling",
  description:
    "Las horas libres de un día repartidas por franja —mañana, tarde, noche—, cada una una pastilla que se toca para elegirla. La elegida se queda a la vista con su check y cada hora puede llevar algo a la derecha, como las caras de los barberos que pueden atender. Quien llama arma las franjas; el componente solo las pinta.",
  importPath: 'import { TimeSlotGroups } from "@/components/scheduling"',
  sourcePath: "src/components/scheduling/TimeSlotGroups.tsx",
  status: "stable",
  tags: ["calendar", "time", "booking", "slots"],
  playground: definePlayground({
    controls: {
      size: { type: "select", label: "Tamaño", options: ["default", "lg"], default: "default" },
      withFaces: { type: "boolean", label: "Con caras", default: true },
    },
    render: ({ size, withFaces }) => <PlaygroundDemo size={size as "default" | "lg"} withFaces={withFaces} />,
    code: ({ size, withFaces }) => `<TimeSlotGroups
  groups={[
    { id: "morning", label: "Mañana", options: [
      { time: "09:00", label: "9:00 a. m.", selected: picked === "09:00"${withFaces ? ", trailing: <Faces ids={…} />" : ""} },
      { time: "10:00", label: "10:00 a. m.", disabled: true },
    ] },
  ]}
  onPick={setPicked}${size === "lg" ? '\n  size="lg"' : ""}
/>`,
  }),
  examples: [
    {
      id: "plain",
      title: "Solo horas",
      description: "Sin `trailing`, la pastilla es solo la hora.",
      layout: "start",
      code: `<TimeSlotGroups groups={groups} onPick={setPicked} />`,
      render: () => <PlaygroundDemo size="default" withFaces={false} />,
    },
  ],
  props: [
    { name: "groups", type: "TimeSlotGroup[]", description: "Las franjas: `id`, `label` y sus `options`." },
    { name: "groups[].options", type: "TimeSlotOption[]", description: "Cada hora: `time` (lo que vuelve), `label` (lo que se lee), `selected`, `disabled`, `ariaLabel` y `trailing`." },
    { name: "onPick", type: "(time: string) => void", description: "Se llama con el `time` de la hora tocada." },
    { name: "size", type: '"default" | "lg"', default: '"default"', description: "`lg` para el dedo (tablet, kiosco)." },
  ],
  guidelines: {
    do: ["Pásale solo las franjas que tienen horas: una franja vacía no se dibuja.", "Usa `ariaLabel` cuando la hora necesita contexto («9:00 a. m. con Emilio»)."],
    dont: ["No lo uses para elegir fecha: para eso, DayStrip.", "No pongas texto largo en `trailing`: es para caras o iconos."],
  },
  related: ["day-strip", "time-slot-picker"],
});
