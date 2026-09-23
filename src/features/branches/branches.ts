import type { Company } from "@/components/app-shell";

/**
 * Las sucursales del negocio.
 *
 * Es el espacio de trabajo de la aplicación: todo lo que se ve —la agenda,
 * la caja, el equipo— es de la sucursal activa, así que se elige desde la
 * cabecera y no desde el menú. Datos de demostración hasta que exista su
 * endpoint (ver docs/API_CONTRACT.md); la forma es la que espera el shell.
 *
 * Los nombres son de estado a propósito: son los más largos que se van a ver
 * en producción («North Carolina», «Massachusetts») y así el chip de la
 * cabecera y la lista se prueban con el peor caso, no con «Centro».
 */
export const BRANCHES: readonly Company[] = [
  { id: "ma", name: "Massachusetts", initial: "MA", meta: "88 Newbury St, Boston · 6 sillas" },
  { id: "nc", name: "North Carolina", initial: "NC", meta: "210 W Trade St, Charlotte · 4 sillas" },
  { id: "ri", name: "Rhode Island", initial: "RI", meta: "134 Thayer St, Providence · 5 sillas" },
  { id: "ut", name: "Utah", initial: "UT", meta: "55 W 200 S, Salt Lake City · 3 sillas" },
];

export const DEFAULT_BRANCH_ID = BRANCHES[0].id;
