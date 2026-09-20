import { ActivityDropdown } from "@/components/ui/activity-dropdown";
import { defineEntry } from "../types";

export const activityDropdownEntry = defineEntry({
  id: "activity-dropdown",
  name: "ActivityDropdown",
  group: "ui",
  description:
    "Tarjeta de actividad que se despliega al hacer clic: la cabecera con el icono de campana se mantiene y la lista aparece con una cascada escalonada de 80ms por fila. Es una pieza autocontenida sin props; los cinco elementos de ejemplo están fijos en el componente.",
  importPath: 'import { ActivityDropdown } from "@/components/ui/activity-dropdown"',
  sourcePath: "src/components/ui/activity-dropdown.tsx",
  status: "beta",
  tags: ["animación", "demo"],
  examples: [
    {
      id: "default",
      title: "Por defecto",
      description: "Haz clic en la cabecera para abrir y cerrar. El radio crece de 2xl a 3xl al expandirse.",
      code: `import { ActivityDropdown } from "@/components/ui/activity-dropdown";

<ActivityDropdown />`,
      render: () => <ActivityDropdown />,
      frameClassName: "min-h-[320px] items-start",
    },
    {
      id: "in-panel",
      title: "Dentro de un panel estrecho",
      description: "Ocupa `w-full` hasta `max-w-md`; las descripciones largas se truncan con puntos suspensivos.",
      code: `<aside className="w-80">
  <ActivityDropdown />
</aside>`,
      render: () => (
        <aside className="w-80">
          <ActivityDropdown />
        </aside>
      ),
      frameClassName: "min-h-[320px] items-start",
    },
  ],
  props: [
    { name: "—", type: "sin props", description: "El componente no acepta props: el estado abierto/cerrado es interno y el contenido está definido en el propio archivo." },
  ],
  guidelines: {
    do: ["Úsalo como referencia del patrón de apertura con `grid-rows-[0fr]` → `[1fr]` y cascada por fila.", "Si lo llevas a producción, extrae la lista a props y traduce los textos."],
    dont: ["No lo montes tal cual en una pantalla real: los textos están en inglés y son fijos.", "No lo uses como menú de notificaciones del header; para eso está el patrón de Popover + lista."],
  },
  related: ["accordion", "popover", "card"],
});
