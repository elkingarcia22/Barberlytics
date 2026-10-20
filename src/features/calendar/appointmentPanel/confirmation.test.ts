import { describe, expect, it, test } from "vitest";
import { confirmationOf } from "./confirmation";

const at = "2026-10-19T10:00:00.000Z";

describe("confirmationOf", () => {
  it("sin respuesta, está sin confirmar y se dice cómo marcarla", () => {
    expect(confirmationOf({ status: "scheduled", confirmation: null })).toMatchObject({ kind: "pending", hint: "calendar.messages.pendingHint" });
  });

  it("confirmada dice cómo (recepción, el enlace o respondiendo el mensaje)", () => {
    expect(confirmationOf({ status: "scheduled", confirmation: { status: "confirmed", at, via: "whatsapp" } })).toMatchObject({ kind: "confirmed", hint: "calendar.messages.confirmedWhatsapp" });
  });

  it("lo que pidió por mensaje gana sobre «sin confirmar»", () => {
    expect(confirmationOf({ status: "scheduled", confirmation: { status: "reschedule_requested", at, via: "whatsapp" } }).kind).toBe("reschedule");
    expect(confirmationOf({ status: "scheduled", confirmation: { status: "declined", at, via: "whatsapp" } }).kind).toBe("declined");
  });

  it("si ya llegó, cuenta como confirmada aunque nadie la marcara", () => {
    expect(confirmationOf({ status: "arrived", confirmation: null })).toMatchObject({ kind: "confirmed", arrived: true, hint: "calendar.messages.confirmedArrived" });
  });

  test("sin respuesta al mensaje que pide confirmar: «no contestó»; confirmar después gana", () => {
    expect(confirmationOf({ status: "scheduled", confirmation: null, noAnswer: true })).toMatchObject({ kind: "noAnswer", label: "calendar.messages.noAnswer" });
    expect(confirmationOf({ status: "scheduled", confirmation: { status: "confirmed", at: "2026-10-19T10:00:00.000Z", via: "reception" }, noAnswer: true }).kind).toBe("confirmed");
    expect(confirmationOf({ status: "arrived", confirmation: null, noAnswer: true }).kind).toBe("confirmed");
  });
});
