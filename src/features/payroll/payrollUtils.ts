import type { Payout, PayrollMember } from "./types";

/** Las ayudas sin JSX de la nómina: el resumen y la exportación. */

export interface PayrollSummary {
  /** Lo que la barbería tiene que pagarle al equipo. */
  toPay: number;
  toPayCount: number;
  /** Lo que los barberos de renta le deben a la barbería. */
  toCollect: number;
  toCollectCount: number;
  commissions: number;
  tips: number;
  services: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

export function summarizePayroll(members: readonly PayrollMember[]): PayrollSummary {
  const paying = members.filter((member) => member.net > 0);
  const owing = members.filter((member) => member.net < 0);
  return {
    toPay: round(paying.reduce((sum, member) => sum + member.net, 0)),
    toPayCount: paying.length,
    toCollect: round(-owing.reduce((sum, member) => sum + member.net, 0)),
    toCollectCount: owing.length,
    commissions: round(members.reduce((sum, member) => sum + member.serviceCommission + member.productCommission, 0)),
    tips: round(members.reduce((sum, member) => sum + member.tips, 0)),
    services: members.reduce((sum, member) => sum + member.services, 0),
  };
}

export const countByPayout = (members: readonly PayrollMember[]): Readonly<Record<Payout, number>> => ({
  commission: members.filter((member) => member.payout === "commission").length,
  rent: members.filter((member) => member.payout === "rent").length,
  salary: members.filter((member) => member.payout === "salary").length,
});

/** Una celda CSV: entre comillas si lleva separador, comillas o salto de línea. */
const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Filas a CSV, con la cabecera primero. Los números van sin formato para que la hoja de cálculo los sume. */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
