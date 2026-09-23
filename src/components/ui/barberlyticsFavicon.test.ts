import { describe, expect, test } from "vitest";
import { buildBarberlyticsFavicon, faviconDataUrl } from "./barberlyticsFavicon";
import { BARBERLYTICS_ICON_ARROW, BARBERLYTICS_ICON_TILE } from "./barberlyticsBrandColors";

const STOPS = ["#111111", "#222222", "#333333"] as const;
const parse = (svg: string) => new DOMParser().parseFromString(svg, "image/svg+xml");

describe("buildBarberlyticsFavicon", () => {
  test("es un icono cuadrado: cuadro redondeado con el gradiente y la flecha encima", () => {
    const doc = parse(buildBarberlyticsFavicon({ stops: STOPS }));
    expect(doc.querySelector("parsererror")).toBeNull();
    const [, , w, h] = doc.documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    expect(w).toBe(h);
    const rect = doc.querySelector("rect")!;
    expect(Number(rect.getAttribute("rx"))).toBeGreaterThan(0);
    expect(rect.getAttribute("fill")).toBe("url(#tile)");
    expect(Array.from(doc.querySelectorAll("stop")).map((stop) => stop.getAttribute("stop-color"))).toEqual([...STOPS]);
    expect(doc.querySelector("path")?.getAttribute("fill")).toBe(BARBERLYTICS_ICON_ARROW);
  });

  test("admite otro color de flecha y otro tamaño", () => {
    const doc = parse(buildBarberlyticsFavicon({ stops: STOPS, arrow: "#000000", size: 180 }));
    expect(doc.documentElement.getAttribute("width")).toBe("180");
    expect(doc.querySelector("path")?.getAttribute("fill")).toBe("#000000");
  });

  test("sin opciones sale el oficial: cuadro champán y flecha carbón", () => {
    const doc = parse(buildBarberlyticsFavicon());
    expect(Array.from(doc.querySelectorAll("stop")).map((stop) => stop.getAttribute("stop-color"))).toEqual([...BARBERLYTICS_ICON_TILE]);
    expect(doc.querySelector("path")?.getAttribute("fill")).toBe(BARBERLYTICS_ICON_ARROW);
  });

  test("el data URL va codificado", () => {
    expect(faviconDataUrl("<svg/>")).toBe("data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E");
  });
});
