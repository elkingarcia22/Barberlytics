import { describe, expect, test } from "vitest";
import { ApiError, codeFromStatus, describeError } from "./errors";

describe("codeFromStatus", () => {
  test("maps the usual statuses", () => {
    expect(codeFromStatus(401)).toBe("unauthorized");
    expect(codeFromStatus(403)).toBe("forbidden");
    expect(codeFromStatus(404)).toBe("not_found");
    expect(codeFromStatus(422)).toBe("validation");
    expect(codeFromStatus(503)).toBe("server");
    expect(codeFromStatus(418)).toBe("unknown");
  });
});

describe("describeError", () => {
  test("prefers a human server message", () => {
    const error = new ApiError({ status: 409, code: "conflict", message: "Alguien lo editó antes." });
    expect(describeError(error)).toMatchObject({ title: "Conflicto", description: "Alguien lo editó antes." });
  });

  test("falls back to the generic copy for unknown errors", () => {
    expect(describeError(new Error("boom")).code).toBe("unknown");
    expect(describeError(null).title).toBe("Algo salió mal");
  });
});
