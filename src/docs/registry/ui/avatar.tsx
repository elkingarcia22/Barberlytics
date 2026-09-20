import * as React from "react";
import { Check, Plus } from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { defineEntry, definePlayground } from "../types";

const SIZES = ["sm", "default", "lg"] as const;
type Size = (typeof SIZES)[number];

const IMG_A = "https://github.com/shadcn.png";
const IMG_B = "https://github.com/vercel.png";

const TEAM = [
  { name: "Ana Torres", initials: "AT", src: IMG_A },
  { name: "Luis Pérez", initials: "LP", src: IMG_B },
  { name: "María Gómez", initials: "MG" },
  { name: "Carlos Ruiz", initials: "CR" },
] as const;

function StatusToggle() {
  const [online, setOnline] = React.useState(true);
  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        <AvatarImage src={IMG_A} alt="Ana Torres" />
        <AvatarFallback>AT</AvatarFallback>
        <AvatarBadge className={online ? "bg-success" : "bg-muted-foreground"} aria-label={online ? "En línea" : "Ausente"} />
      </Avatar>
      <Button variant="outline" size="sm" onClick={() => setOnline((value) => !value)}>
        {online ? "Marcar ausente" : "Marcar en línea"}
      </Button>
    </div>
  );
}

export const avatarEntry = defineEntry({
  id: "avatar",
  name: "Avatar",
  group: "ui",
  description:
    "Imagen circular que representa a una persona o equipo, con iniciales de respaldo mientras carga o si la imagen falla. Úsalo en listas de usuarios, comentarios, asignaciones y cabeceras de perfil.",
  importPath: 'import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"',
  sourcePath: "src/components/ui/avatar.tsx",
  status: "stable",
  tags: ["radix"],
  playground: definePlayground({
    controls: {
      size: { type: "select", options: SIZES, default: "default" },
      withImage: { type: "boolean", label: "Con imagen", default: true },
      withBadge: { type: "boolean", label: "Con badge de estado", default: false },
      fallback: { type: "text", label: "Iniciales", default: "AT" },
    },
    render: ({ size, withImage, withBadge, fallback }) => (
      <Avatar size={size as Size}>
        {withImage && <AvatarImage src={IMG_A} alt="Ana Torres" />}
        <AvatarFallback>{fallback}</AvatarFallback>
        {withBadge && <AvatarBadge className="bg-success" />}
      </Avatar>
    ),
    code: ({ size, withImage, withBadge, fallback }) => {
      const open = size === "default" ? "<Avatar>" : `<Avatar size="${size}">`;
      return [
        open,
        withImage ? `  <AvatarImage src="/ana-torres.png" alt="Ana Torres" />` : "",
        `  <AvatarFallback>${fallback}</AvatarFallback>`,
        withBadge ? `  <AvatarBadge className="bg-success" />` : "",
        "</Avatar>",
      ]
        .filter(Boolean)
        .join("\n");
    },
  }),
  examples: [
    {
      id: "sizes",
      title: "Tamaños",
      description: "24, 32 y 40px. El fallback ajusta su tipografía automáticamente.",
      code: `<Avatar size="sm"><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar size="lg"><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>`,
      render: () => (
        <div className="flex items-center gap-4">
          {SIZES.map((size) => (
            <Avatar key={size} size={size}>
              <AvatarImage src={IMG_A} alt="Ana Torres" />
              <AvatarFallback>AT</AvatarFallback>
            </Avatar>
          ))}
        </div>
      ),
    },
    {
      id: "fallback",
      title: "Iniciales de respaldo",
      description: "Sin `src` (o si la imagen falla) se muestran las iniciales; `delayMs` evita el parpadeo cuando la imagen carga rápido.",
      code: `<Avatar>
  <AvatarFallback>MG</AvatarFallback>
</Avatar>
<Avatar>
  <AvatarImage src="/ruta-rota.png" alt="Carlos Ruiz" />
  <AvatarFallback delayMs={300}>CR</AvatarFallback>
</Avatar>`,
      render: () => (
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>MG</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/ruta-rota.png" alt="Carlos Ruiz" />
            <AvatarFallback delayMs={300}>CR</AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      id: "badge",
      title: "Badge de estado",
      description: "`AvatarBadge` se ancla abajo a la derecha y escala con el tamaño; el color se pasa por `className`.",
      code: `const [online, setOnline] = React.useState(true);

<Avatar size="lg">
  <AvatarImage src="…" alt="Ana Torres" />
  <AvatarFallback>AT</AvatarFallback>
  <AvatarBadge className={online ? "bg-success" : "bg-muted-foreground"} />
</Avatar>`,
      render: () => <StatusToggle />,
    },
    {
      id: "group",
      title: "Grupo con contador",
      description: "`AvatarGroup` solapa los avatares y `AvatarGroupCount` cierra la pila con los que faltan o una acción.",
      code: `<AvatarGroup>
  <Avatar><AvatarImage src="…" /><AvatarFallback>AT</AvatarFallback></Avatar>
  <Avatar><AvatarImage src="…" /><AvatarFallback>LP</AvatarFallback></Avatar>
  <Avatar><AvatarFallback>MG</AvatarFallback></Avatar>
  <AvatarGroupCount>+8</AvatarGroupCount>
</AvatarGroup>

<AvatarGroup>
  <Avatar size="sm"><AvatarFallback>AT</AvatarFallback></Avatar>
  <Avatar size="sm"><AvatarFallback>LP</AvatarFallback></Avatar>
  <AvatarGroupCount><Plus /></AvatarGroupCount>
</AvatarGroup>`,
      render: () => (
        <div className="flex items-center gap-8">
          <AvatarGroup>
            {TEAM.slice(0, 3).map((member) => (
              <Avatar key={member.name}>
                {"src" in member && <AvatarImage src={member.src} alt={member.name} />}
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+8</AvatarGroupCount>
          </AvatarGroup>
          <AvatarGroup>
            {TEAM.slice(0, 2).map((member) => (
              <Avatar key={member.name} size="sm">
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>
              <Plus />
            </AvatarGroupCount>
          </AvatarGroup>
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Check className="size-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      ),
    },
  ],
  props: [
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "24, 32 o 40px. Badge y contador del grupo se ajustan al tamaño." },
    { name: "AvatarImage.src / alt", type: "string", description: "Imagen del usuario. Mientras carga o si falla, se muestra el fallback." },
    { name: "AvatarFallback.delayMs", type: "number", description: "Retrasa el fallback para evitar parpadeos con imágenes rápidas." },
    { name: "AvatarBadge", type: 'React.ComponentProps<"span">', description: "Punto de estado en la esquina inferior derecha; el color va en `className`." },
    { name: "AvatarGroup", type: 'React.ComponentProps<"div">', description: "Solapa los avatares hijos con un anillo del color de fondo." },
    { name: "AvatarGroupCount", type: 'React.ComponentProps<"div">', description: "Círculo final del grupo para «+N» o un icono de acción." },
  ],
  guidelines: {
    do: ["Usa siempre un `AvatarFallback` con iniciales (máximo dos letras).", "Incluye `alt` descriptivo en la imagen.", "Limita el grupo a 3-4 avatares visibles y agrupa el resto en el contador."],
    dont: ["No mezcles tamaños dentro del mismo grupo.", "No uses el badge para más de un estado; un color, un significado.", "No lo uses como botón sin envolverlo en un control accesible."],
  },
  related: ["badge", "hover-card", "card"],
});
