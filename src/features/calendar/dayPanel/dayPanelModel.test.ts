import { describe, expect, it } from "vitest";
import { clientsOf } from "./dayPanelModel";
import type { Appointment } from "../types";

const at = (id: string, clientId: string, start: string, status: Appointment["status"] = "scheduled") => ({ id, clientId, start, status }) as Appointment;

describe("clientsOf", () => {
  it("cuenta a cada cliente una vez, con su primera cita del día", () => {
    const clients = clientsOf([at("b", "c1", "2026-10-19T15:00"), at("a", "c1", "2026-10-19T09:00"), at("c", "c2", "2026-10-19T10:00")]);
    expect(clients.map((item) => [item.clientId, item.first.id, item.count])).toEqual([
      ["c1", "a", 2],
      ["c2", "c", 1],
    ]);
  });

  it("deja fuera las canceladas y las de quien no vino", () => {
    expect(clientsOf([at("a", "c1", "2026-10-19T09:00", "cancelled"), at("b", "c2", "2026-10-19T10:00", "no_show")])).toEqual([]);
  });
});
