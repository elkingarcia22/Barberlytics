import * as React from "react";
import { Eye, EyeOff, Link2, Mail, Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { defineEntry, definePlayground } from "../types";

const ALIGNS = ["inline-start", "inline-end", "block-start", "block-end"] as const;
type Align = (typeof ALIGNS)[number];

function PasswordField() {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="w-full max-w-sm space-y-1.5">
      <Label htmlFor="ig-password">Contraseña</Label>
      <InputGroup>
        <InputGroupInput id="ig-password" type={visible ? "text" : "password"} placeholder="Mínimo 8 caracteres" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setVisible((value) => !value)}>
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function SearchField() {
  const [query, setQuery] = React.useState("liderazgo");
  return (
    <InputGroup className="w-full max-w-sm">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput placeholder="Buscar…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar" />
      {query && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Limpiar" onClick={() => setQuery("")}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

const MAX_CHARS = 140;

function CountedTextarea() {
  const [text, setText] = React.useState("");
  return (
    <InputGroup className="w-full max-w-md">
      <InputGroupTextarea placeholder="Escribe una descripción corta…" rows={3} value={text} onChange={(event) => setText(event.target.value.slice(0, MAX_CHARS))} aria-label="Descripción" />
      <InputGroupAddon align="block-end" className="border-t border-border/60 justify-end">
        <InputGroupText className={text.length >= MAX_CHARS ? "text-destructive" : undefined}>
          {text.length}/{MAX_CHARS}
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

export const inputGroupEntry = defineEntry({
  id: "input-group",
  name: "InputGroup",
  group: "ui",
  description:
    "Campo compacto (32px) con complementos integrados: iconos, texto, botones o incluso un textarea con pie. Úsalo cuando el campo necesita contexto o una acción pegada (buscar, limpiar, mostrar contraseña); para un campo simple basta con Input.",
  importPath: 'import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea, InputGroupButton, InputGroupText } from "@/components/ui/input-group"',
  sourcePath: "src/components/ui/input-group.tsx",
  status: "stable",
  tags: ["cva"],
  playground: definePlayground({
    controls: {
      align: { type: "select", label: "Posición del addon", options: ALIGNS, default: "inline-start" },
      kind: { type: "select", label: "Tipo de addon", options: ["icon", "text", "button"], default: "icon" },
      placeholder: { type: "text", default: "nombre@empresa.com" },
      disabled: { type: "boolean", default: false },
    },
    render: ({ align, kind, placeholder, disabled }) => {
      const addon =
        kind === "icon" ? <Mail /> : kind === "text" ? <InputGroupText>@ubits.co</InputGroupText> : <InputGroupButton variant="outline">Verificar</InputGroupButton>;
      return (
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput placeholder={placeholder} disabled={disabled} aria-label="Correo" />
          <InputGroupAddon align={align as Align}>{addon}</InputGroupAddon>
        </InputGroup>
      );
    },
    code: ({ align, kind, placeholder, disabled }) => {
      const addon = kind === "icon" ? "<Mail />" : kind === "text" ? "<InputGroupText>@ubits.co</InputGroupText>" : '<InputGroupButton variant="outline">Verificar</InputGroupButton>';
      const alignAttr = align !== "inline-start" ? ` align="${align}"` : "";
      return `<InputGroup>
  <InputGroupInput placeholder="${placeholder}"${disabled ? " disabled" : ""} />
  <InputGroupAddon${alignAttr}>${addon}</InputGroupAddon>
</InputGroup>`;
    },
  }),
  examples: [
    {
      id: "search",
      title: "Búsqueda con limpiar",
      description: "Icono al inicio y un botón de limpiar que aparece solo cuando hay texto. Clic en el addon enfoca el input.",
      code: `const [query, setQuery] = React.useState("");

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput placeholder="Buscar…" value={query} onChange={(event) => setQuery(event.target.value)} />
  {query && (
    <InputGroupAddon align="inline-end">
      <InputGroupButton size="icon-xs" aria-label="Limpiar" onClick={() => setQuery("")}><X /></InputGroupButton>
    </InputGroupAddon>
  )}
</InputGroup>`,
      render: () => <SearchField />,
    },
    {
      id: "password",
      title: "Mostrar u ocultar contraseña",
      code: `const [visible, setVisible] = React.useState(false);

<InputGroup>
  <InputGroupInput type={visible ? "text" : "password"} placeholder="Mínimo 8 caracteres" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" aria-label="Mostrar contraseña" onClick={() => setVisible((value) => !value)}>
      {visible ? <EyeOff /> : <Eye />}
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>`,
      render: () => <PasswordField />,
    },
    {
      id: "prefix-suffix",
      title: "Prefijo y sufijo de texto",
      description: "`InputGroupText` para unidades, dominios o protocolos.",
      code: `<InputGroup>
  <InputGroupAddon><InputGroupText><Link2 /> https://</InputGroupText></InputGroupAddon>
  <InputGroupInput placeholder="mi-empresa" />
  <InputGroupAddon align="inline-end"><InputGroupText>.ubits.co</InputGroupText></InputGroupAddon>
</InputGroup>`,
      render: () => (
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <InputGroupText>
              <Link2 /> https://
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="mi-empresa" aria-label="Subdominio" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>.ubits.co</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ),
    },
    {
      id: "textarea",
      title: "Textarea con contador",
      description: "`InputGroupTextarea` + un addon `block-end` como pie del campo.",
      code: `<InputGroup>
  <InputGroupTextarea placeholder="Escribe una descripción corta…" rows={3} value={text} onChange={…} />
  <InputGroupAddon align="block-end" className="justify-end border-t">
    <InputGroupText>{text.length}/140</InputGroupText>
  </InputGroupAddon>
</InputGroup>`,
      render: () => <CountedTextarea />,
    },
  ],
  props: [
    { name: "InputGroup", type: 'React.ComponentProps<"div">', description: "Contenedor `role=\"group\"` de 32px que dibuja borde, foco y estado inválido de su control." },
    { name: "InputGroupAddon.align", type: '"inline-start" | "inline-end" | "block-start" | "block-end"', default: '"inline-start"', description: "Posición del complemento. Los `block-*` apilan el grupo en columna." },
    { name: "InputGroupInput", type: 'React.ComponentProps<"input">', description: "Input sin borde propio; hereda el foco del grupo." },
    { name: "InputGroupTextarea", type: 'React.ComponentProps<"textarea">', description: "Textarea sin borde propio; el grupo crece en altura." },
    { name: "InputGroupButton.size", type: '"xs" | "sm" | "icon-xs" | "icon-sm"', default: '"xs"', description: "Botón compacto (ghost por defecto) para acciones dentro del campo." },
    { name: "InputGroupButton.variant", type: "ButtonProps[\"variant\"]", default: '"ghost"', description: "Variante del botón." },
    { name: "InputGroupText", type: 'React.ComponentProps<"span">', description: "Texto o icono+texto en color secundario." },
  ],
  guidelines: {
    do: ["Pon `aria-label` en los botones de solo icono dentro del grupo.", "Usa `InputGroupText` para unidades y prefijos fijos en lugar de placeholder.", "Mantén un solo botón por lado."],
    dont: ["No mezcles InputGroup (32px) con Input (40px) en la misma fila sin ajustar alturas.", "No anides otro InputGroup dentro.", "No uses addons `block-*` con inputs de una línea; son para textarea."],
  },
  related: ["input", "textarea", "button", "command"],
});
