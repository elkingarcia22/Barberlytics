import { describe, expect, test } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  test("un texto que parece fórmula queda como texto; los números negativos no se tocan", () => {
    const csv = toCsv(["Nombre", "Valor"], [["=HYPERLINK(\"http://x\")", -12], ["@SUM(A1)", 5], ["Juan, el de la 3", 1]]);
    expect(csv.split("\n")).toEqual(["Nombre,Valor", `"'=HYPERLINK(""http://x"")",-12`, "'@SUM(A1),5", '"Juan, el de la 3",1']);
  });
});
