import { describe, expect, test } from "vitest";
import { DEMO_ACCOUNTS, DEMO_OTP_CODE } from "../../server/auth/demoAccounts";
import { ACCOUNTS } from "./db";
import { OTP_CODE } from "./handlers";

describe("cuentas de la demo en el servidor", () => {
  test("son las mismas del backend simulado, con el mismo código", () => {
    expect(DEMO_ACCOUNTS.map((item) => [item.phone, item.sub, item.role, item.mid])).toEqual(ACCOUNTS.map((item) => [item.phone, item.user.id, item.user.teamRole, item.user.memberId]));
    expect(DEMO_OTP_CODE).toBe(OTP_CODE);
  });
});
