import { beforeEach, describe, expect, test } from "vitest";
import { act, render } from "@testing-library/react";
import { useTableConfig, type TableConfig } from "./useTableConfig";
import type { TableColumnSpec } from "./tableConfigTypes";

const COLUMNS: TableColumnSpec[] = [
  { id: "select", label: "Selección", fixed: true },
  { id: "name", label: "Nombre" },
  { id: "state", label: "Estado" },
];

/** Monta el hook y devuelve siempre su último valor. */
function montar(tableId: string) {
  const ref: { current: TableConfig | null } = { current: null };
  function Sonda() {
    ref.current = useTableConfig(tableId, COLUMNS);
    return null;
  }
  render(<Sonda />);
  return ref as { current: TableConfig };
}

describe("useTableConfig · vista", () => {
  beforeEach(() => window.localStorage.clear());

  test("arranca en rejilla y no cuenta como configuración tocada", () => {
    const config = montar("t1");
    expect(config.current.view).toBe("table");
    expect(config.current.isDirty).toBe(false);
  });

  test("cambiar a lista se recuerda y marca la configuración como tocada", () => {
    const config = montar("t2");
    act(() => config.current.setView("list"));
    expect(config.current.view).toBe("list");
    expect(config.current.isDirty).toBe(true);

    // Otra tabla con la misma llave la recupera; es una preferencia de quien lee.
    expect(montar("t2").current.view).toBe("list");
  });

  test("volver a lo de fábrica devuelve la rejilla", () => {
    const config = montar("t3");
    act(() => config.current.setView("list"));
    act(() => config.current.reset());
    expect(config.current.view).toBe("table");
    expect(config.current.isDirty).toBe(false);
  });

  test("lo guardado antes de que existiera la vista se lee como rejilla", () => {
    window.localStorage.setItem(
      "thema.tabla.t4",
      JSON.stringify({ order: ["name", "state"], hidden: [], pinned: [], mode: "paged" })
    );
    const config = montar("t4");
    expect(config.current.view).toBe("table");
    expect(config.current.mode).toBe("paged");
  });
});
