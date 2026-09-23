import * as React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Briefcase, GraduationCap, UsersRound, Wallet } from "lucide-react";
import { TemplateCatalogDrawer } from "./TemplateCatalogDrawer";
import type { TemplateDefinition, TemplateGroup } from "./templateTypes";

const ONBOARDING: TemplateDefinition = {
  id: "onboarding",
  label: "Onboarding",
  name: "Plan de onboarding",
  description: "Los primeros treinta días de quien entra.",
  meta: "4 elementos · Mes",
  icon: GraduationCap,
  tone: "brand",
  featured: true,
  pitch: "La más corta, y la que enseña cómo funciona una plantilla.",
  items: [
    { label: "Completar la ruta de inducción", weight: 40, hint: "Cursos obligatorios del cargo." },
    { label: "Entregar el equipo y los accesos", weight: 20 },
  ],
};

const CLIMA: TemplateDefinition = {
  id: "clima",
  label: "Clima",
  name: "Encuesta de clima",
  description: "Favorabilidad, liderazgo y plan de acción por área.",
  meta: "3 elementos · Semestre",
  icon: UsersRound,
  tone: "positive",
  items: [{ label: "Subir la favorabilidad general", weight: 50 }],
};

const FINANZAS: TemplateDefinition = {
  id: "finanzas",
  label: "Finanzas",
  name: "Objetivos financieros",
  description: "Margen, cartera y control del gasto.",
  meta: "3 elementos · Semestre",
  icon: Wallet,
  tone: "warning",
  items: [{ label: "Subir el margen bruto", weight: 40 }],
};

const GROUPS: readonly TemplateGroup[] = [
  { id: "personas", label: "Personas", description: "La gente.", icon: UsersRound, templates: [ONBOARDING, CLIMA] },
  { id: "negocio", label: "Negocio", description: "Lo que se vende.", icon: Briefcase, templates: [FINANZAS] },
];

/** El panel controlado desde fuera, como lo monta una pantalla real. */
function Host({
  initialTemplateId = null,
  onUseTemplate = () => {},
  groups = GROUPS,
}: {
  initialTemplateId?: string | null;
  onUseTemplate?: (template: TemplateDefinition) => void;
  groups?: readonly TemplateGroup[];
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <TemplateCatalogDrawer
      open={open}
      onOpenChange={setOpen}
      groups={groups}
      initialTemplateId={initialTemplateId}
      onUseTemplate={onUseTemplate}
    />
  );
}

describe("TemplateCatalogDrawer", () => {
  test("abierto, muestra los estantes con sus plantillas y la destacada arriba", () => {
    render(<Host />);

    expect(screen.getByRole("heading", { name: "Personas" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Negocio" })).toBeTruthy();
    expect(screen.getByLabelText("Recomendada: Plan de onboarding")).toBeTruthy();
    expect(screen.getByText("La más corta, y la que enseña cómo funciona una plantilla.")).toBeTruthy();
  });

  test("cerrado, no monta nada", () => {
    render(
      <TemplateCatalogDrawer open={false} onOpenChange={() => {}} groups={GROUPS} onUseTemplate={() => {}} />
    );

    expect(screen.queryByLabelText("Buscar plantilla")).toBeNull();
  });

  test("la búsqueda filtra por nombre sin exigir la tilde y aparta la destacada", async () => {
    render(<Host />);

    await userEvent.type(screen.getByLabelText("Buscar plantilla"), "favorabilidad");

    expect(screen.getByRole("heading", { name: "Personas" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Negocio" })).toBeNull();
    expect(screen.queryByLabelText("Recomendada: Plan de onboarding")).toBeNull();
  });

  test("la búsqueda también encuentra por el contenido de la plantilla", async () => {
    render(<Host />);

    await userEvent.type(screen.getByLabelText("Buscar plantilla"), "margen");

    expect(screen.getByRole("heading", { name: "Negocio" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Personas" })).toBeNull();
  });

  test("sin resultados, ofrece volver a todo el catálogo", async () => {
    render(<Host />);

    await userEvent.type(screen.getByLabelText("Buscar plantilla"), "zzz");
    expect(screen.getByText(/No encontramos plantillas/)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Ver todas las plantillas" }));
    expect(screen.getByRole("heading", { name: "Personas" })).toBeTruthy();
  });

  test("abrir una plantilla lleva a su ficha con sus líneas y su peso", async () => {
    render(<Host />);

    await userEvent.click(screen.getByRole("button", { name: /Encuesta de clima/ }));

    expect(screen.getByRole("heading", { name: "Encuesta de clima" })).toBeTruthy();
    expect(screen.getByText("Subir la favorabilidad general")).toBeTruthy();
    expect(screen.getByText("Favorabilidad, liderazgo y plan de acción por área.")).toBeTruthy();
  });

  test("la ficha muestra el detalle de cada línea cuando lo trae", async () => {
    render(<Host initialTemplateId="onboarding" />);

    expect(screen.getByText("Cursos obligatorios del cargo.")).toBeTruthy();
  });

  test("desde la ficha se vuelve a la galería", async () => {
    render(<Host initialTemplateId="clima" />);

    expect(screen.queryByRole("heading", { name: "Personas" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Todas las plantillas" }));
    expect(screen.getByRole("heading", { name: "Personas" })).toBeTruthy();
  });

  test("abre directamente en la ficha que señala initialTemplateId", () => {
    render(<Host initialTemplateId="finanzas" />);

    expect(screen.getByRole("heading", { name: "Objetivos financieros" })).toBeTruthy();
  });

  test("«Usar plantilla» entrega la plantilla abierta a quien monta el panel", async () => {
    const onUseTemplate = vi.fn();
    render(<Host initialTemplateId="clima" onUseTemplate={onUseTemplate} />);

    await userEvent.click(screen.getByRole("button", { name: "Usar plantilla" }));

    expect(onUseTemplate).toHaveBeenCalledTimes(1);
    expect(onUseTemplate.mock.calls[0][0].id).toBe("clima");
  });

  test("la destacada se puede usar sin pasar por su ficha", async () => {
    const onUseTemplate = vi.fn();
    render(<Host onUseTemplate={onUseTemplate} />);

    await userEvent.click(screen.getByRole("button", { name: "Usar plantilla" }));

    expect(onUseTemplate.mock.calls[0][0].id).toBe("onboarding");
  });

  test("la ficha ofrece otras plantillas y saltar a una cambia de ficha", async () => {
    render(<Host initialTemplateId="onboarding" />);

    expect(screen.getByRole("heading", { name: "Otras que te pueden servir" })).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /Encuesta de clima/ }));
    expect(screen.getByRole("heading", { name: "Encuesta de clima" })).toBeTruthy();
  });

  test("la vista de lista cambia las fichas sin perder las plantillas", async () => {
    render(<Host />);

    await userEvent.click(screen.getByRole("radio", { name: "Lista" }));

    expect(screen.getByRole("radio", { name: "Lista" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: /Encuesta de clima/ })).toBeTruthy();
  });

  test("con un solo estante, la galería no dibuja su cabecera", () => {
    render(<Host groups={[{ id: "todas", label: "Todas las plantillas", templates: [ONBOARDING, CLIMA] }]} />);

    expect(screen.queryByRole("heading", { name: "Todas las plantillas" })).toBeNull();
    expect(screen.getByRole("button", { name: /Encuesta de clima/ })).toBeTruthy();
  });
});
