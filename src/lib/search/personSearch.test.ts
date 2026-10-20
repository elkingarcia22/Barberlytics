import { describe, expect, test } from "vitest";
import { matchesPerson, matchesSearchText, normalizeSearch, personSearchText } from "./personSearch";

const marcela = { name: "Marcela Gómez", phone: "+57 364 730 670", email: "marcela.gomez@correo.co" };

describe("buscar a una persona por nombre, celular o correo", () => {
  test("sin nada escrito, todos salen", () => {
    expect(matchesPerson(marcela, "")).toBe(true);
    expect(matchesPerson(marcela, "   ")).toBe(true);
  });

  test("encuentra por nombre sin tildes ni mayúsculas y con las palabras en cualquier orden", () => {
    expect(matchesPerson(marcela, "marcela")).toBe(true);
    expect(matchesPerson(marcela, "GOMEZ")).toBe(true);
    expect(matchesPerson(marcela, "gómez marce")).toBe(true);
    expect(matchesPerson(marcela, "marcela perez")).toBe(false);
  });

  test("encuentra por celular escrito con o sin espacios, signos o indicativo", () => {
    expect(matchesPerson(marcela, "364730")).toBe(true);
    expect(matchesPerson(marcela, "364 730 670")).toBe(true);
    expect(matchesPerson(marcela, "+57 364-730")).toBe(true);
    expect(matchesPerson(marcela, "999")).toBe(false);
  });

  test("con menos de tres cifras no busca por celular (saldrían todos)", () => {
    expect(matchesPerson(marcela, "36")).toBe(false);
  });

  test("encuentra por correo, entero o en parte", () => {
    expect(matchesPerson(marcela, "marcela.gomez@correo.co")).toBe(true);
    expect(matchesPerson(marcela, "@correo")).toBe(true);
    expect(matchesPerson(marcela, "Marcela.Gomez@")).toBe(true);
    expect(matchesPerson(marcela, "otro@correo.co")).toBe(false);
  });

  test("sin celular ni correo, solo busca por nombre", () => {
    expect(matchesPerson({ name: "Andrés Beltrán" }, "andres")).toBe(true);
    expect(matchesPerson({ name: "Andrés Beltrán", phone: null, email: null }, "300")).toBe(false);
  });

  test("el texto buscable junta nombre, celular, sus cifras y correo", () => {
    const text = personSearchText(marcela);
    expect(text).toContain("marcela gomez");
    expect(text).toContain("57364730670");
    expect(text).toContain("marcela.gomez@correo.co");
  });

  test("normaliza tildes, mayúsculas y espacios", () => {
    expect(normalizeSearch("  Ingresó   HOY ")).toBe("ingreso hoy");
  });
});

describe("buscar en un texto cualquiera", () => {
  const row = "Marcela Gómez · VIP · +57 364 730 670 · marcela.gomez@correo.co · Sede Centro";

  test("todas las palabras, sin tildes y en cualquier orden", () => {
    expect(matchesSearchText(row, "gomez centro")).toBe(true);
    expect(matchesSearchText(row, "Gómez norte")).toBe(false);
  });

  test("un celular escrito de cualquier manera encuentra el del texto", () => {
    expect(matchesSearchText(row, "364730670")).toBe(true);
    expect(matchesSearchText(row, "364-730")).toBe(true);
    expect(matchesSearchText(row, "+57 364")).toBe(true);
  });

  test("las cifras de dos datos distintos no se juntan", () => {
    expect(matchesSearchText("Corte · 30 min · US$ 32", "3032")).toBe(false);
  });

  test("el correo, entero o en parte", () => {
    expect(matchesSearchText(row, "@correo.co")).toBe(true);
  });
});
