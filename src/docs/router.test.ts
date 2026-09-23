import { describe, expect, test } from "vitest";
import { parseHash, routeToHash } from "./router";

describe("parseHash", () => {
  test("empty or root hashes go home", () => {
    expect(parseHash("")).toEqual({ kind: "home" });
    expect(parseHash("#/")).toEqual({ kind: "home" });
    expect(parseHash("#")).toEqual({ kind: "home" });
  });

  test("reads foundation, component and group routes", () => {
    expect(parseHash("#/foundations/colors")).toEqual({ kind: "foundation", id: "colors" });
    expect(parseHash("#/guides/botones")).toEqual({ kind: "guide", id: "botones" });
    expect(parseHash("#/components/button")).toEqual({ kind: "component", id: "button" });
    expect(parseHash("#/group/ui")).toEqual({ kind: "group", id: "ui" });
  });

  test("unknown sections fall back to home", () => {
    expect(parseHash("#/nope/x")).toEqual({ kind: "home" });
    expect(parseHash("#/components")).toEqual({ kind: "home" });
  });
});

describe("routeToHash", () => {
  test("round-trips every route kind", () => {
    for (const hash of ["#/", "#/foundations/motion", "#/guides/como-usar", "#/components/badge", "#/group/forms"]) {
      expect(routeToHash(parseHash(hash))).toBe(hash);
    }
  });
});
