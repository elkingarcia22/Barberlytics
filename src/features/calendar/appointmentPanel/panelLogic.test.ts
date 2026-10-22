import { describe, expect, test } from "vitest";
import type { useAppT } from "@/app/i18n";
import type { AppointmentPlaybook } from "../appointmentPlaybook";
import type { Appointment, Client } from "../types";
import { clientTags, clockRelation, mainAction, previousStatus, quickActions, restActions, showsRequest } from "./panelLogic";
import { topicOf } from "./appointmentAgent";
import { LOYALTY_EVERY, type AppointmentModel } from "./useAppointmentModel";

const t = ((key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)) as ReturnType<typeof useAppT>;

const appointment = {
  id: "apt_1",
  start: "2026-10-17T15:00",
  durationMin: 30,
  status: "seated",
  source: "online",
  linkId: null,
  referencePhotos: [],
  history: [],
} as unknown as Appointment;

const client = { id: "c1", name: "Marcela Gómez", type: "frequent", visits: 12, noShows: 2, notes: [] } as unknown as Client;

function model(overrides: Partial<AppointmentModel> = {}): AppointmentModel {
  // phone vacío: sin contacto, salvo que la prueba lo ponga.
  const playbook: AppointmentPlaybook = { stage: "late", primary: ["call", "message", "checkIn"], secondary: ["noShow", "edit"], more: ["cancel"] };
  return { appointment, client, known: client, requested: undefined, playbook, loyaltyProgress: 3, phone: "", conduct: [], stepTimes: { arrived: null, seated: null, paid: null }, ...overrides } as unknown as AppointmentModel;
}

describe("mainAction and restActions", () => {
  test("the main action is the last primary one and contact links stay out of the menu", () => {
    const current = model();
    expect(mainAction(current)).toBe("checkIn");
    expect(restActions(current)).toEqual(["noShow", "cancel"]);
  });
});

describe("clientTags", () => {
  test("shows no-shows and membership progress; where it came from goes in the origin line", () => {
    const ids = clientTags(model(), t).map((tag) => tag.id);
    expect(ids).toEqual(["noShows", "member"]);
  });

  test("warns about reported behavior before anything else about the client", () => {
    const report = { id: "r1", reasons: ["rude"], text: "", appointmentId: null, by: "Recepción", createdAt: "2026-10-01T10:00:00.000Z" } as const;
    const tag = clientTags(model({ conduct: [{ ...report, reasons: [...report.reasons] }] }), t).find((item) => item.id === "conduct");
    expect(tag).toMatchObject({ tone: "danger", label: "calendar.conduct.reason.rude" });
  });

  test("marks a ready reward when the membership is full", () => {
    const member = clientTags(model({ loyaltyProgress: LOYALTY_EVERY }), t).find((tag) => tag.id === "member");
    expect(member?.tone).toBe("success");
  });

  test("says when the shop blocked the client or asks them to pay upfront", () => {
    const restricted = { ...client, blocked: true, onlineOnly: true } as Client;
    const tags = clientTags(model({ known: restricted, client: restricted }), t);
    expect(tags.find((tag) => tag.id === "blocked")?.tone).toBe("danger");
    expect(tags.find((tag) => tag.id === "prepay")?.tone).toBe("warning");
  });

  test("operational tags leave out money and reliability", () => {
    expect(clientTags(model(), t, { operational: true })).toEqual([]);
  });
});

describe("clockRelation", () => {
  test("says how long is left while in the chair, and how much it went over", () => {
    const seated = model({ playbook: { stage: "seated", primary: ["pay"], secondary: [], more: [] } });
    expect(clockRelation(seated, new Date(2026, 9, 17, 15, 20), t)).toContain("calendar.panel.desk.endsIn");
    expect(clockRelation(seated, new Date(2026, 9, 17, 15, 45), t)).toContain("calendar.panel.desk.overtime");
  });

  test("says nothing without a clock", () => {
    expect(clockRelation(model(), undefined, t)).toBeNull();
  });
});

describe("quickActions", () => {
  test("a late client gets call, write, no-show and cancel, while check-in stays the main action", () => {
    const late = model({ phone: "+573001112233" });
    expect(quickActions(late)).toEqual(["call", "message", "noShow", "cancel"]);
    expect(mainAction(late)).toBe("checkIn");
  });

  test("without a phone there are no contact shortcuts", () => {
    expect(quickActions(model())).toEqual(["noShow", "cancel"]);
  });

  test("once in the shop there are no shortcuts: the action is the footer's", () => {
    const waiting = model({ phone: "+573001112233", playbook: { stage: "waiting", primary: ["seat"], secondary: ["pay"], more: ["cancel"] } });
    const seated = model({ phone: "+573001112233", playbook: { stage: "seated", primary: ["pay"], secondary: [], more: ["cancel"] } });
    expect(quickActions(waiting)).toEqual([]);
    expect(quickActions(seated)).toEqual([]);
  });
});

describe("showsRequest", () => {
  test("keeps the booking note in view until the visit is charged", () => {
    const withNote = { ...appointment, notes: "Degradado bajo" } as Appointment;
    expect(showsRequest(model({ appointment: withNote }))).toBe(true);
    expect(showsRequest(model({ appointment: withNote, playbook: { stage: "paid", primary: ["rebook"], secondary: [], more: [] } }))).toBe(false);
    expect(showsRequest(model())).toBe(false);
  });
});

describe("topicOf", () => {
  test("reads the question without accents or case", () => {
    expect(topicOf("¿Tiene ALÉRGIAS?")).toBe("alerts");
    expect(topicOf("¿Qué tengo que saber de la cita?")).toBe("summary");
    expect(topicOf("¿Cuándo le agendo la próxima?")).toBe("next");
    expect(topicOf("¿Cada cuánto viene?")).toBe("rhythm");
    expect(topicOf("hola")).toBe("unknown");
  });
});

describe("previousStatus", () => {
  test("goes back one step, reactivates a closed one and never undoes a payment", () => {
    expect(previousStatus("arrived")).toBe("scheduled");
    expect(previousStatus("seated")).toBe("arrived");
    expect(previousStatus("cancelled")).toBe("scheduled");
    expect(previousStatus("no_show")).toBe("scheduled");
    expect(previousStatus("scheduled")).toBeNull();
    expect(previousStatus("paid")).toBeNull();
  });
});
