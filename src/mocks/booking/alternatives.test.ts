import { describe, expect, test } from "vitest";
import { db } from "../db";
import { dateKey } from "../calendar/seed";
import { alternatives } from "./alternatives";
import { bookableBarbers } from "./logic";

const activeBranches = (db.settings.lists.branches as unknown as { id: string; status: string }[]).filter((branch) => branch.status === "active");
const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return dateKey(date);
};

describe("barberos recomendados", () => {
  test("solo recomienda a quien hace lo pedido, sabe de lo mismo y tiene horas", () => {
    const serviceIds = ["svc_corte"];
    const day = tomorrow();
    let checked = 0;
    for (const branch of activeBranches) {
      for (const chosen of bookableBarbers(branch.id)) {
        const items = alternatives(branch.id, day, serviceIds, chosen.id);
        for (const item of items) {
          checked += 1;
          expect(item.barberId).not.toBe(chosen.id);
          expect(item.times.length).toBeGreaterThan(0);
          // Al menos una habilidad en común: o cubre lo pedido o la comparte con el elegido.
          expect(item.skills.length).toBeGreaterThan(0);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
