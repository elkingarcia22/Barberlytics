import { describe, expect, test } from "vitest";
import type { useAppT } from "@/app/i18n";
import type { AppointmentPlaybook } from "../appointmentPlaybook";
import type { Appointment, Client } from "../types";
import { clientTags, clockRelation, mainAction, restActions } from "./panelLogic";
import { isPanelVersion } from "./panelVersion";
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
  const playbook: AppointmentPlaybook = { stage: "late", primary: ["call", "whatsapp", "checkIn"], secondary: ["noShow", "edit"], more: ["cancel"] };
  return { appointment, client, known: client, requested: undefined, playbook, loyaltyProgress: 3, stepTimes: { arrived: null, seated: null, paid: null }, ...overrides } as unknown as AppointmentModel;
}

describe("mainAction and restActions", () => {
  test("the main action is the last primary one and contact links stay out of the menu", () => {
    const current = model();
    expect(mainAction(current)).toBe("checkIn");
    expect(restActions(current)).toEqual(["noShow", "cancel"]);
  });
});

describe("clientTags", () => {
  test("shows no-shows, online and membership progress for a known client", () => {
    const ids = clientTags(model(), t).map((tag) => tag.id);
    expect(ids).toEqual(["noShows", "online", "member"]);
  });

  test("marks a ready reward when the membership is full", () => {
    const member = clientTags(model({ loyaltyProgress: LOYALTY_EVERY }), t).find((tag) => tag.id === "member");
    expect(member?.tone).toBe("success");
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

describe("isPanelVersion", () => {
  test("accepts only the known versions", () => {
    expect(isPanelVersion("desk")).toBe(true);
    expect(isPanelVersion("popover")).toBe(false);
    expect(isPanelVersion(null)).toBe(false);
  });
});
