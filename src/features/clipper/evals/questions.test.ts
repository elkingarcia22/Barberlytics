import { describe, expect, test } from "vitest";
import { CLIPPER_TOOLS, toolsFor } from "@/lib/clipper/toolCatalog";
import { CLIPPER_EVALS } from "./questions";

describe("conjunto de evaluación de Clipper", () => {
  test("tiene al menos 50 preguntas, con las tres variantes y los cinco roles", () => {
    expect(CLIPPER_EVALS.length).toBeGreaterThanOrEqual(50);
    for (const variant of ["es-CO", "es-US", "en"]) expect(CLIPPER_EVALS.filter((item) => item.variant === variant).length).toBeGreaterThanOrEqual(10);
    expect(new Set(CLIPPER_EVALS.map((item) => item.role)).size).toBe(5);
    expect(new Set(CLIPPER_EVALS.map((item) => item.id)).size).toBe(CLIPPER_EVALS.length);
  });

  test("cada pregunta espera herramientas que existen y que su rol tiene (o una que el rol no tiene, para medir el permiso)", () => {
    const names = new Set(CLIPPER_TOOLS.map((tool) => tool.name));
    for (const item of CLIPPER_EVALS) {
      expect(item.tools.every((tool) => names.has(tool)), item.id).toBe(true);
      const offered = new Set(toolsFor(item.role).map((tool) => tool.name));
      if (!item.id.startsWith("perm-")) expect(item.tools.some((tool) => offered.has(tool)), item.id).toBe(true);
      if (item.expect === "propose") expect(item.tools.every((tool) => tool.startsWith("proponer_")), item.id).toBe(true);
    }
  });
});
