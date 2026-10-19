import { describe, expect, test } from "vitest";
import { buildIcs, calendarUrl } from "./bookingFormat";
import type { BookedAppointment } from "./types";

const item = { id: "apt_1", reservationId: null, branchId: "ut", branchName: "Utah", timeZone: "America/Denver", personName: "Marcela", guestRelation: null, serviceIds: ["svc_corte"], serviceNames: ["Corte"], barberId: "team-04", barberName: "Andrés", barberAvatarUrl: null, noPreference: false, start: "2026-10-20T10:30:00", durationMin: 30, price: 35, paid: 0, status: "scheduled" } as unknown as BookedAppointment;

describe("la cita en el calendario del cliente va con la zona de la sede", () => {
  test("el .ics lleva TZID con la hora de la sede", () => {
    const ics = buildIcs([item], "Barbería Demo");
    expect(ics).toContain("DTSTART;TZID=America/Denver:20261020T103000");
    expect(ics).toContain("DTEND;TZID=America/Denver:20261020T110000");
  });

  test("Google recibe la zona y Outlook la hora con su desfase", () => {
    expect(new URL(calendarUrl("google", item, "Barbería Demo")).searchParams.get("ctz")).toBe("America/Denver");
    expect(new URL(calendarUrl("outlook", item, "Barbería Demo")).searchParams.get("startdt")).toBe("2026-10-20T10:30:00-06:00");
  });

  test("sin zona, como antes: hora flotante", () => {
    expect(buildIcs([{ ...item, timeZone: undefined }], "Barbería Demo")).toContain("DTSTART:20261020T103000");
  });
});
