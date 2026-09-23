import { describe, expect, test } from "vitest";
import { buildBarberlyticsAppIcon, buildBarberlyticsLogoSvg, LOGO_X } from "./barberlyticsLogoSvg";
import { WORDMARK_BOX } from "./barberlyticsLogoPaths";

const parse = (svg: string) => new DOMParser().parseFromString(svg, "image/svg+xml");

describe("buildBarberlyticsLogoSvg", () => {
  test("logotipo con fondo: SVG válido, con el aire de respeto y el alto por proporción", () => {
    const { svg, width, height } = buildBarberlyticsLogoSvg({
      variant: "wordmark",
      ink: "#111111",
      stops: ["#aa0000", "#bb0000", "#cc0000"],
      background: "#ffffff",
      width: 2048,
    });
    const doc = parse(svg);
    expect(doc.querySelector("parsererror")).toBeNull();
    const [, , w, h] = doc.documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    expect(w).toBeCloseTo(WORDMARK_BOX.w + LOGO_X * 2, 1);
    expect(h).toBeCloseTo(WORDMARK_BOX.h + LOGO_X * 2, 1);
    expect(width).toBe(2048);
    expect(height).toBe(Math.round((2048 * h) / w));
    expect(doc.querySelector("rect")?.getAttribute("fill")).toBe("#ffffff");
    expect(doc.querySelectorAll("linearGradient")).toHaveLength(2);
    expect(Array.from(doc.querySelectorAll("#word stop")).map((stop) => stop.getAttribute("offset"))).toEqual(["0%", "52%", "100%"]);
  });

  test("transparente no pinta fondo", () => {
    const { svg } = buildBarberlyticsLogoSvg({ variant: "wordmark", ink: "#fff", stops: ["#1", "#2", "#3"], background: null, width: 1024 });
    expect(parse(svg).querySelector("rect")).toBeNull();
  });

  test("isotipo cuadrado por defecto, solo con la flecha", () => {
    const { svg, width, height } = buildBarberlyticsLogoSvg({ variant: "mark", ink: "#000", stops: ["#1", "#2", "#3", "#4", "#5"], background: null, width: 1024 });
    const doc = parse(svg);
    expect(width).toBe(height);
    expect(doc.querySelectorAll("path")).toHaveLength(1);
    expect(Array.from(doc.querySelectorAll("stop")).map((stop) => stop.getAttribute("offset"))).toEqual(["0%", "25%", "50%", "75%", "100%"]);
  });

  test("una tinta: sin gradientes, todo en el color de la tinta", () => {
    const { svg } = buildBarberlyticsLogoSvg({ variant: "wordmark", ink: "#123456", stops: [], background: null, width: 512 });
    const doc = parse(svg);
    expect(doc.querySelector("linearGradient")).toBeNull();
    expect(Array.from(doc.querySelectorAll("path")).every((path) => path.getAttribute("fill") === "#123456")).toBe(true);
  });

  test("icono de app: cuadrado, cuadro redondeado y flecha del color pedido", () => {
    const { svg, width, height } = buildBarberlyticsAppIcon({ fill: ["#1", "#2", "#3"], arrow: "#fff", size: 512 });
    const doc = parse(svg);
    expect(width).toBe(512);
    expect(height).toBe(512);
    expect(doc.querySelector("rect")?.getAttribute("fill")).toBe("url(#tile)");
    expect(doc.querySelector("path")?.getAttribute("fill")).toBe("#fff");
  });

  test("icono de app en una tinta: cuadro liso, sin gradiente", () => {
    const doc = parse(buildBarberlyticsAppIcon({ fill: ["#222"], arrow: "#fff", size: 64 }).svg);
    expect(doc.querySelector("linearGradient")).toBeNull();
    expect(doc.querySelector("rect")?.getAttribute("fill")).toBe("#222");
  });
});
