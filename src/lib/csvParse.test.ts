import { describe, expect, test } from "vitest";
import { parseCsv } from "./csvParse";

describe("parseCsv", () => {
  test("lee comas, comillas con comas dentro y comillas escapadas", () => {
    expect(parseCsv('Nombre,Celular\n"Pérez, Juan",3001234567\n"Dice ""hola""",300')).toEqual([["Nombre", "Celular"], ["Pérez, Juan", "3001234567"], ['Dice "hola"', "300"]]);
  });

  test("detecta punto y coma (Excel en español), quita la marca BOM y las filas vacías", () => {
    expect(parseCsv("\uFEFFNombre;Correo\r\nAna;ana@x.com\r\n\r\n")).toEqual([["Nombre", "Correo"], ["Ana", "ana@x.com"]]);
  });
});
