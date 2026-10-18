import { describe, expect, test } from "vitest";
import { guessColumns, rowsFrom, toIsoDate } from "./importColumns";

describe("importar clientes: columnas", () => {
  test("adivina las columnas en español y junta nombre y apellido", () => {
    const map = guessColumns(["Nombres", "Apellidos", "Teléfono", "Correo electrónico", "Cumpleaños"]);
    expect(map).toEqual({ firstName: 0, lastName: 1, phone: 2, email: 3, birthDate: 4 });
    expect(rowsFrom([["Juan", "Pérez", "300 123 4567", "j@x.com", "15/03/1990"]], map)).toEqual([{ name: "Juan Pérez", phone: "300 123 4567", email: "j@x.com", birthDate: "1990-03-15", note: "" }]);
  });

  test("entiende fechas en orden de EE. UU. cuando el día no cabe como mes", () => {
    expect(toIsoDate("03/25/1988")).toBe("1988-03-25");
    expect(toIsoDate("no sé")).toBe("");
  });
});
