import { Armchair, CalendarClock, CalendarX2, ConciergeBell, Crown, HandCoins, MailQuestion, Scissors, ShieldCheck, TrendingDown, UsersRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import type { TableColumnCells, TableColumnSpec } from "@/components/data-display/table-config";
import { BRANCHES } from "@/features/branches";
import type { AppMessageKey } from "@/app/i18n/types";

/**
 * Los datos del home de equipo.
 *
 * Mismo trato que `dashboard/homeTemplate.tsx`: deterministas y sin backend, de
 * forma que la pantalla se vea igual en cualquier máquina y en cualquier
 * captura. Al conectarla se sustituye este módulo por la consulta de la
 * sucursal activa y la pantalla no cambia.
 *
 * Lo que sí es de dominio y no de ejemplo son **los roles**: son los cinco con
 * los que ya trabaja la plataforma (los mismos del selector de la cabecera), y
 * de ellos cuelga todo lo demás —qué columnas aplican, qué se le liquida a cada
 * quien y qué avisos tiene sentido levantar—.
 */

export type TeamRoleId = "owner" | "admin" | "recepcion" | "barbero-comision" | "barbero-renta";

/** Qué se le liquida a cada rol en el ciclo: no todos cobran igual. */
export type PayoutKind = "commission" | "rent" | "salary" | "none";

export interface TeamRoleSpec {
  id: TeamRoleId;
  /** El nombre largo, el mismo que usa el selector de rol de la cabecera. */
  labelKey: AppMessageKey;
  /** El nombre corto, para la fila de filtros y la columna de la tabla. */
  shortKey: AppMessageKey;
  hintKey: AppMessageKey;
  icon: LucideIcon;
  payout: PayoutKind;
  /** Atiende con silla: le aplican agenda, servicios y lo generado. */
  worksChair: boolean;
  /**
   * De qué responde: el dueño de toda la barbería, quien administra de su
   * sucursal, y quien atiende únicamente de su silla. Es lo que decide si la
   * pantalla le enseña cómo va su agenda o cómo va la gente que tiene a cargo.
   */
  scope: "shop" | "branch" | "chair";
}

/** El valor del filtro de rol cuando no filtra nada. */
export const ALL_ROLES = "todos";

export type TeamRoleFilter = TeamRoleId | typeof ALL_ROLES;

/** No corta: lo suyo es el equipo, no la silla. */
export const isManagerRole = (role: TeamRoleFilter): boolean =>
  role !== ALL_ROLES && ROLE_BY_ID[role].scope !== "chair";

export const TEAM_ROLES: readonly TeamRoleSpec[] = [
  { id: "owner", labelKey: "role.owner", shortKey: "team.role.ownerShort", hintKey: "role.ownerHint", icon: Crown, payout: "none", worksChair: false, scope: "shop" },
  { id: "admin", labelKey: "role.admin", shortKey: "team.role.adminShort", hintKey: "role.adminHint", icon: ShieldCheck, payout: "salary", worksChair: false, scope: "branch" },
  { id: "recepcion", labelKey: "role.reception", shortKey: "team.role.receptionShort", hintKey: "role.receptionHint", icon: ConciergeBell, payout: "salary", worksChair: false, scope: "branch" },
  { id: "barbero-comision", labelKey: "role.barberCommission", shortKey: "team.role.commissionShort", hintKey: "role.barberCommissionHint", icon: Scissors, payout: "commission", worksChair: true, scope: "chair" },
  { id: "barbero-renta", labelKey: "role.barberRent", shortKey: "team.role.rentShort", hintKey: "role.barberRentHint", icon: Armchair, payout: "rent", worksChair: true, scope: "chair" },
];

export const ROLE_BY_ID: Readonly<Record<TeamRoleId, TeamRoleSpec>> = Object.fromEntries(
  TEAM_ROLES.map((role) => [role.id, role])
) as Record<TeamRoleId, TeamRoleSpec>;

export const PAYOUT_KEYS: Readonly<Record<PayoutKind, AppMessageKey | null>> = {
  commission: "team.payout.commission",
  rent: "team.payout.rent",
  salary: "team.payout.salary",
  none: null,
};

export type TeamStatus = "active" | "invited" | "inactive";

export const TEAM_STATUS_KEYS: Readonly<Record<TeamStatus, AppMessageKey>> = {
  active: "userStatus.active",
  invited: "userStatus.invited",
  inactive: "userStatus.inactive",
};

const STATUS_TONE: Readonly<Record<TeamStatus, "active" | "pending" | "inactive">> = {
  active: "active",
  invited: "pending",
  inactive: "inactive",
};

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRoleId;
  branchId: string;
  status: TeamStatus;
  /** La silla que ocupa; `null` en quien no atiende. */
  chair: number | null;
  /** Porcentaje de su turno con cita. `null` cuando el rol no atiende. */
  occupancy: number | null;
  /** Servicios cerrados en la semana. */
  services: number | null;
  /** Lo que generó en el ciclo, en la moneda de la sucursal. */
  revenue: number | null;
  /** Lo que se liquida con esa persona: su comisión, su renta o su sueldo. */
  payout: number | null;
  /** Clientes que repiten con ella, en porcentaje. */
  retention: number | null;
  /** Días hasta el corte de su renta; negativo = vencida. `null` si no paga renta. */
  rentDueOffset: number | null;
  /** Turnos que cerró sin cuadrar la caja. */
  openRegisters: number;
  /** Días desde hoy de su última actividad; `null` si nunca ha entrado. */
  lastActiveOffset: number | null;
}

/** Lo variable de cada persona; lo demás se deduce del rol y del nombre. */
type MemberDraft = Partial<Omit<TeamMember, "id" | "name" | "email" | "role" | "branchId">>;

const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ".");

function member(index: number, name: string, role: TeamRoleId, branchId: string, draft: MemberDraft = {}): TeamMember {
  return {
    id: `team-${String(index).padStart(2, "0")}`,
    name,
    email: `${slug(name)}@barberia.com`,
    role,
    branchId,
    status: "active",
    chair: null,
    occupancy: null,
    services: null,
    revenue: null,
    payout: null,
    retention: null,
    rentDueOffset: null,
    openRegisters: 0,
    lastActiveOffset: 0,
    ...draft,
  };
}

/**
 * El equipo de las cuatro sucursales.
 *
 * Quien no atiende no trae agenda ni servicios —no es un cero, es que no
 * aplica—, y quien está invitado no trae nada todavía: son dos formas
 * distintas de «vacío» y la tabla las pinta distinto.
 */
export const TEAM_MEMBERS: readonly TeamMember[] = [
  member(1, "Carolina Vargas", "owner", "ma"),
  member(2, "Mateo Herrera", "admin", "ma", { payout: 1450, openRegisters: 1 }),
  member(3, "Lucía Bernal", "recepcion", "ma", { payout: 980, openRegisters: 1 }),
  member(4, "Andrés Beltrán", "barbero-comision", "ma", { chair: 1, occupancy: 86, services: 38, revenue: 2140, payout: 856, retention: 72 }),
  member(5, "Nicolás Duarte", "barbero-comision", "ma", { chair: 2, occupancy: 64, services: 27, revenue: 1480, payout: 592, retention: 58, lastActiveOffset: -1 }),
  member(6, "Valeria Marín", "barbero-renta", "ma", { chair: 3, occupancy: 91, services: 41, revenue: 2360, payout: 320, retention: 77, rentDueOffset: 4 }),
  member(7, "Tomás Peña", "barbero-renta", "ma", { chair: 4, occupancy: 35, services: 12, revenue: 690, payout: 320, retention: 41, rentDueOffset: -3, lastActiveOffset: -2 }),
  member(8, "Daniela Osorio", "barbero-comision", "ma", { chair: 5, occupancy: 72, services: 31, revenue: 1720, payout: 688, retention: 65 }),
  member(9, "Julián Cifuentes", "barbero-comision", "ma", { status: "invited", chair: 6, lastActiveOffset: null }),

  member(10, "Valentina Ruiz", "admin", "nc", { payout: 1380 }),
  member(11, "Camilo Restrepo", "barbero-comision", "nc", { chair: 1, occupancy: 78, services: 33, revenue: 1810, payout: 724, retention: 69 }),
  member(12, "Manuela Salgado", "barbero-renta", "nc", { chair: 2, occupancy: 44, services: 17, revenue: 940, payout: 280, retention: 52, rentDueOffset: 1, lastActiveOffset: -1 }),
  member(13, "Esteban Lara", "barbero-renta", "nc", { chair: 3, occupancy: 29, services: 9, revenue: 470, payout: 280, retention: 38, rentDueOffset: -8, lastActiveOffset: -4 }),
  member(14, "Paula Cárdenas", "recepcion", "nc", { payout: 920 }),
  member(15, "Samuel Ortiz", "barbero-comision", "nc", { status: "invited", chair: 4, lastActiveOffset: null }),

  member(16, "Diego Salazar", "admin", "ri", { payout: 1400 }),
  member(17, "Renata Méndez", "recepcion", "ri", { payout: 950, lastActiveOffset: -1 }),
  member(18, "Juliana Prieto", "barbero-comision", "ri", { chair: 1, occupancy: 83, services: 36, revenue: 1980, payout: 792, retention: 74 }),
  member(19, "Felipe Guzmán", "barbero-comision", "ri", { chair: 2, occupancy: 46, services: 18, revenue: 990, payout: 396, retention: 47, lastActiveOffset: -3 }),
  member(20, "Antonia Vélez", "barbero-renta", "ri", { chair: 3, occupancy: 88, services: 39, revenue: 2210, payout: 300, retention: 79, rentDueOffset: 6 }),
  member(21, "Rubén Castaño", "barbero-renta", "ri", { status: "inactive", chair: 4, lastActiveOffset: -45 }),

  member(22, "Ana Torres", "admin", "ut", { payout: 1320, openRegisters: 1 }),
  member(23, "Santiago Rico", "barbero-comision", "ut", { chair: 1, occupancy: 69, services: 28, revenue: 1540, payout: 616, retention: 61 }),
  member(24, "Gabriela Nieto", "barbero-renta", "ut", { chair: 2, occupancy: 74, services: 30, revenue: 1660, payout: 260, retention: 66, rentDueOffset: -1 }),
  member(25, "Isabella Franco", "recepcion", "ut", { status: "invited", lastActiveOffset: null }),
];

const BRANCH_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  BRANCHES.map((branch) => [branch.id, branch.name])
);

export const branchName = (id: string): string => BRANCH_NAMES[id] ?? id;

/** Quien atiende y está activo: la base de las métricas de sillas. */
export const isWorkingBarber = (member: TeamMember): boolean =>
  ROLE_BY_ID[member.role].worksChair && member.status === "active";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

export function offsetToDate(offset: number, today = new Date()): Date {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
}

export const formatRowDate = (offset: number, intlLocale: string): string =>
  new Intl.DateTimeFormat(intlLocale, DATE_OPTIONS).format(offsetToDate(offset));

/** Traductor tipado con las claves de la aplicación. */
type Translate = (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;

/** Lo que no aplica a un rol se escribe una sola vez, y en un solo sitio. */
const EMPTY = "—";

export function teamColumns(t: Translate): readonly TableColumnSpec[] {
  return [
    { id: "select", label: t("column.selection"), fixed: true },
    { id: "person", label: t("team.column.person") },
    { id: "role", label: t("team.column.role") },
    { id: "branch", label: t("team.column.branch") },
    { id: "chair", label: t("team.column.chair"), hiddenByDefault: true },
    { id: "agenda", label: t("team.column.agenda") },
    { id: "services", label: t("team.column.services") },
    { id: "revenue", label: t("team.column.revenue"), hiddenByDefault: true },
    { id: "payout", label: t("team.column.payout") },
    { id: "status", label: t("team.column.status") },
    { id: "lastActive", label: t("team.column.lastActive"), hiddenByDefault: true },
  ];
}

export interface TeamCellFormatters {
  intlLocale: string;
  formatCount: (value: number) => string;
  formatMoney: (value: number) => string;
}

export function teamCells(t: Translate, { intlLocale, formatCount, formatMoney }: TeamCellFormatters): TableColumnCells<TeamMember> {
  return {
    person: {
      head: t("team.column.person"),
      cell: (row) => (
        <span className="flex flex-col">
          <span className="font-semibold text-text-primary">{row.name}</span>
          <span className="text-xs text-text-muted">{row.email}</span>
        </span>
      ),
    },
    role: {
      head: t("team.column.role"),
      cell: (row) => {
        const role = ROLE_BY_ID[row.role];
        const Icon = role.icon;
        return (
          <span className="flex items-center gap-inline text-text-secondary">
            <Icon className="size-4 shrink-0 text-text-muted" strokeWidth={2} />
            {t(role.labelKey)}
          </span>
        );
      },
    },
    branch: { head: t("team.column.branch"), cell: (row) => branchName(row.branchId), cellClassName: "text-text-secondary" },
    chair: {
      head: t("team.column.chair"),
      cell: (row) => (row.chair === null ? EMPTY : t("team.chair", { number: row.chair })),
      cellClassName: "text-text-secondary",
    },
    agenda: {
      head: t("team.column.agenda"),
      headClassName: "text-right",
      cell: (row) =>
        row.occupancy === null ? (
          <span className="block text-right text-text-muted">{EMPTY}</span>
        ) : (
          <span className="flex items-center justify-end gap-inline">
            <Progress value={Math.min(100, row.occupancy)} className="h-1.5 w-20" />
            <span className="w-10 text-right tabular-nums">{row.occupancy}%</span>
          </span>
        ),
    },
    services: {
      head: t("team.column.services"),
      headClassName: "text-right",
      cell: (row) => (row.services === null ? EMPTY : formatCount(row.services)),
      cellClassName: "text-right tabular-nums",
    },
    revenue: {
      head: t("team.column.revenue"),
      headClassName: "text-right",
      cell: (row) => (row.revenue === null ? EMPTY : formatMoney(row.revenue)),
      cellClassName: "text-right tabular-nums",
    },
    payout: {
      head: t("team.column.payout"),
      headClassName: "text-right",
      cell: (row) => {
        const concept = PAYOUT_KEYS[ROLE_BY_ID[row.role].payout];
        if (row.payout === null || concept === null) return <span className="block text-right text-text-muted">{EMPTY}</span>;
        return (
          <span className="flex items-baseline justify-end gap-inline">
            <span className="tabular-nums">{formatMoney(row.payout)}</span>
            <span className="text-xs text-text-muted">{t(concept)}</span>
          </span>
        );
      },
    },
    status: {
      head: t("team.column.status"),
      cell: (row) => <StatusBadge status={STATUS_TONE[row.status]} label={t(TEAM_STATUS_KEYS[row.status])} />,
    },
    lastActive: {
      head: t("team.column.lastActive"),
      cell: (row) => (row.lastActiveOffset === null ? EMPTY : formatRowDate(row.lastActiveOffset, intlLocale)),
      cellClassName: "text-text-secondary tabular-nums",
    },
  };
}

/* ── Sucursales a cargo ─────────────────────────────────────── */

const BRANCH_IDS: readonly string[] = BRANCHES.map((branch) => branch.id);

/** De qué sucursales responde: de todas si es el dueño, de la suya si no. */
const managedBranches = (member: TeamMember): readonly string[] =>
  ROLE_BY_ID[member.role].scope === "shop" ? BRANCH_IDS : [member.branchId];

/** La gente que cae bajo el cargo de estas personas, sin repetir a nadie. */
function managedTeam(managers: readonly TeamMember[]): readonly TeamMember[] {
  const branches = new Set(managers.flatMap(managedBranches));
  return TEAM_MEMBERS.filter((member) => branches.has(member.branchId));
}

/** Le pasa algo a alguien de las sucursales de las que responde. */
const managesSomeone = (member: TeamMember, problem: (other: TeamMember) => boolean): boolean =>
  managedBranches(member).some((branch) =>
    TEAM_MEMBERS.some((other) => other.branchId === branch && problem(other))
  );

/* ── Turnos sin cubrir ──────────────────────────────────────── */

export interface OpenShift {
  id: string;
  dayOffset: number;
  slot: string;
  branchId: string;
  chair: number;
  reasonKey: AppMessageKey;
}

/** Franjas con silla libre y sin barbero: o se asignan, o se cierran a reserva. */
export const OPEN_SHIFTS: readonly OpenShift[] = [
  { id: "shift-1", dayOffset: 0, slot: "09:00 – 14:00", branchId: "ma", chair: 4, reasonKey: "team.shifts.reason.sick" },
  { id: "shift-2", dayOffset: 0, slot: "14:00 – 20:00", branchId: "nc", chair: 3, reasonKey: "team.shifts.reason.vacation" },
  { id: "shift-3", dayOffset: 1, slot: "10:00 – 16:00", branchId: "ri", chair: 4, reasonKey: "team.shifts.reason.left" },
  { id: "shift-4", dayOffset: 2, slot: "09:00 – 15:00", branchId: "ma", chair: 6, reasonKey: "team.shifts.reason.open" },
  { id: "shift-5", dayOffset: 3, slot: "15:00 – 20:00", branchId: "ut", chair: 3, reasonKey: "team.shifts.reason.open" },
  { id: "shift-6", dayOffset: 4, slot: "09:00 – 14:00", branchId: "nc", chair: 4, reasonKey: "team.shifts.reason.vacation" },
];

/* ── Métricas ──────────────────────────────────────────────── */

export interface TeamMetric {
  id: string;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  /** El valor de esta semana, calculado sobre las filas. */
  value: number;
  /** El de la semana pasada: no se deduce de las filas, es el corte anterior. */
  previous: number;
  /** Cómo se lee: un porcentaje o un recuento. */
  unit: "percent" | "count";
  /** Cuánta gente sostiene la lectura: no es la misma para la agenda que para el equipo. */
  basis: number;
  /** Bajar es la buena noticia: un turno sin cubrir menos no se pinta en rojo. */
  lowerIsBetter?: boolean;
  series: readonly { label: string; value: number }[];
}

const average = (values: readonly number[]) =>
  values.length === 0 ? 0 : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

const share = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10);

/**
 * La historia de cada métrica, escrita como la distancia de cada semana al
 * valor de hoy. Así cualquier recorte —un rol, las sucursales de alguien—
 * trae su propia serie sin tener que inventar una tabla de datos por
 * combinación, y el corte anterior sale del mismo sitio que la serie.
 */
const HISTORY: Readonly<Record<string, readonly number[]>> = {
  ocupacion: [7.9, 7.3, 5.9, 5.7, 5.1, 2.4, 0],
  servicios: [29, 37, 52, 45, 43, 20, 0],
  retencion: [-4.1, -3.5, -2.9, -2.4, -1.7, -1.1, 0],
  equipoActivo: [-12, -8, -8, -4, -4, -4, 0],
  turnos: [-3, -2, -2, -1, -1, 1, 0],
  agenda: [7.9, 7.3, 5.9, 5.7, 5.1, 2.4, 0],
};

interface MetricDraft {
  id: keyof typeof HISTORY;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  unit: "percent" | "count";
  value: number;
  basis: number;
  lowerIsBetter?: boolean;
}

/** Cierra una métrica: su serie, su corte anterior y de cuánta gente sale. */
function metric({ id, labelKey, hintKey, unit, value, basis, lowerIsBetter }: MetricDraft): TeamMetric {
  const shape = HISTORY[id];
  const week = (offset: number) => {
    const point = value + offset;
    if (point <= 0) return 0;
    return unit === "count" ? Math.round(point) : Math.round(point * 10) / 10;
  };
  return {
    id,
    labelKey,
    hintKey,
    unit,
    value,
    basis,
    lowerIsBetter,
    previous: week(shape[shape.length - 2] ?? 0),
    series: shape.map((offset, index) => ({ label: `S${index + 1}`, value: week(offset) })),
  };
}

/**
 * El pulso de quien atiende: cómo va la silla. Las tres lecturas salen de las
 * mismas filas que están abajo, así que no pueden contradecir a la tabla.
 */
function chairMetrics(members: readonly TeamMember[]): readonly TeamMetric[] {
  const working = members.filter(isWorkingBarber);
  return [
    metric({
      id: "ocupacion",
      labelKey: "team.metric.occupancy",
      hintKey: "team.metric.occupancyHint",
      unit: "percent",
      value: average(working.map((member) => member.occupancy ?? 0)),
      basis: working.length,
    }),
    metric({
      id: "servicios",
      labelKey: "team.metric.services",
      hintKey: "team.metric.servicesHint",
      unit: "count",
      value: sum(working.map((member) => member.services ?? 0)),
      basis: working.length,
    }),
    metric({
      id: "retencion",
      labelKey: "team.metric.retention",
      hintKey: "team.metric.retentionHint",
      unit: "percent",
      value: average(working.map((member) => member.retention ?? 0)),
      basis: working.length,
    }),
  ];
}

/**
 * El pulso de quien no corta: cómo va la gente que tiene a cargo. Un owner o
 * un admin no tienen agenda propia —enseñarles «ocupación de sillas» sería
 * enseñarles un cero—, así que lo que se mide es su equipo: cuánta gente
 * tienen en pie, cuántos turnos les quedan por cubrir y cómo van las sillas
 * de las que responden.
 */
function managedMetrics(managers: readonly TeamMember[]): readonly TeamMetric[] {
  const team = managedTeam(managers);
  const working = team.filter(isWorkingBarber);
  const branches = new Set(managers.flatMap(managedBranches));
  const shifts = OPEN_SHIFTS.filter((shift) => branches.has(shift.branchId)).length;

  return [
    metric({
      id: "equipoActivo",
      labelKey: "team.metric.staffed",
      hintKey: "team.metric.staffedHint",
      unit: "percent",
      value: share(team.filter((member) => member.status === "active").length, team.length),
      basis: team.length,
    }),
    metric({
      id: "turnos",
      labelKey: "team.metric.openShifts",
      hintKey: "team.metric.openShiftsHint",
      unit: "count",
      value: shifts,
      basis: team.length,
      lowerIsBetter: true,
    }),
    metric({
      id: "agenda",
      labelKey: "team.metric.teamAgenda",
      hintKey: "team.metric.teamAgendaHint",
      unit: "percent",
      value: average(working.map((member) => member.occupancy ?? 0)),
      basis: working.length,
    }),
  ];
}

/** Las filas del rol puesto; con «Todos», el equipo entero. */
export const membersOfRole = (role: TeamRoleFilter, members: readonly TeamMember[] = TEAM_MEMBERS): readonly TeamMember[] =>
  role === ALL_ROLES ? members : members.filter((member) => member.role === role);

/**
 * El pulso del equipo, leído desde el rol que esté puesto: la silla para quien
 * atiende, el equipo a cargo para quien administra.
 */
export function teamMetrics(role: TeamRoleFilter = ALL_ROLES): readonly TeamMetric[] {
  const members = membersOfRole(role);
  return isManagerRole(role) ? managedMetrics(members) : chairMetrics(members);
}

/* ── Avisos ────────────────────────────────────────────────── */

/**
 * Un aviso por cosa que alguien tiene que resolver hoy, y cada uno apuntando a
 * los roles a los que le puede pasar: la renta solo la debe quien alquila su
 * silla, la caja solo la cuadra quien cobra. El número del aviso y las filas
 * que revela su clic salen del mismo predicado; si divergen, el aviso miente.
 */
export type TeamAlertId = "rent" | "idle" | "register" | "invited" | "branchIdle" | "branchShifts" | "branchRent";

export interface TeamAlertPreset {
  id: TeamAlertId;
  labelKey: AppMessageKey;
  hintKey: AppMessageKey;
  icon: LucideIcon;
  tone: "warning" | "negative";
  /** A quién le aplica: se lee en el aviso y explica por qué no sale para todos. */
  roles: readonly TeamRoleId[];
  /**
   * Qué mira el aviso. `person` es algo que esa persona tiene pendiente;
   * `managed` es algo que tiene pendiente la gente de la que responde. Los de
   * `managed` solo se ofrecen con un rol administrativo puesto: en «Todos» la
   * pantalla mira a cada quien como individuo, y sacar los dos a la vez
   * contaría el mismo problema dos veces —al barbero con la silla parada y al
   * admin que la tiene a cargo—.
   */
  scope: "person" | "managed";
  matches: (member: TeamMember) => boolean;
}

/** Por debajo de esto una silla está parada, no floja. */
export const IDLE_OCCUPANCY = 50;

/** Los roles que administran; los avisos de gestión no salen de aquí. */
const OWNS_BRANCH: readonly TeamRoleId[] = ["owner", "admin"];
const RUNS_FLOOR: readonly TeamRoleId[] = ["owner", "admin", "recepcion"];

/** Hoy: lo que no está cubierto para hoy no admite «ya lo vemos». */
const isToday = (shift: OpenShift) => shift.dayOffset === 0;

export const TEAM_ALERTS: readonly TeamAlertPreset[] = [
  {
    id: "rent",
    labelKey: "team.alert.rent",
    hintKey: "team.alert.rentHint",
    icon: Wallet,
    tone: "negative",
    roles: ["barbero-renta"],
    scope: "person",
    matches: (member) => member.role === "barbero-renta" && member.rentDueOffset !== null && member.rentDueOffset < 0,
  },
  {
    id: "idle",
    labelKey: "team.alert.idle",
    hintKey: "team.alert.idleHint",
    icon: TrendingDown,
    tone: "warning",
    roles: ["barbero-comision", "barbero-renta"],
    scope: "person",
    matches: (member) => isWorkingBarber(member) && (member.occupancy ?? 0) < IDLE_OCCUPANCY,
  },
  {
    id: "register",
    labelKey: "team.alert.register",
    hintKey: "team.alert.registerHint",
    icon: CalendarClock,
    tone: "negative",
    roles: ["admin", "recepcion"],
    scope: "person",
    matches: (member) => member.openRegisters > 0,
  },
  {
    id: "invited",
    labelKey: "team.alert.invited",
    hintKey: "team.alert.invitedHint",
    icon: MailQuestion,
    tone: "warning",
    roles: ["owner", "admin", "recepcion", "barbero-comision", "barbero-renta"],
    scope: "person",
    matches: (member) => member.status === "invited",
  },
  {
    id: "branchShifts",
    labelKey: "team.alert.branchShifts",
    hintKey: "team.alert.branchShiftsHint",
    icon: CalendarX2,
    tone: "negative",
    roles: RUNS_FLOOR,
    scope: "managed",
    matches: (member) =>
      RUNS_FLOOR.includes(member.role) &&
      OPEN_SHIFTS.some((shift) => isToday(shift) && managedBranches(member).includes(shift.branchId)),
  },
  {
    id: "branchIdle",
    labelKey: "team.alert.branchIdle",
    hintKey: "team.alert.branchIdleHint",
    icon: UsersRound,
    tone: "warning",
    roles: OWNS_BRANCH,
    scope: "managed",
    matches: (member) =>
      OWNS_BRANCH.includes(member.role) &&
      managesSomeone(member, (other) => isWorkingBarber(other) && (other.occupancy ?? 0) < IDLE_OCCUPANCY),
  },
  {
    id: "branchRent",
    labelKey: "team.alert.branchRent",
    hintKey: "team.alert.branchRentHint",
    icon: HandCoins,
    tone: "warning",
    roles: OWNS_BRANCH,
    scope: "managed",
    matches: (member) =>
      OWNS_BRANCH.includes(member.role) &&
      managesSomeone(member, (other) => other.rentDueOffset !== null && other.rentDueOffset < 0),
  },
];

/**
 * Los avisos que tiene sentido ofrecer con este rol puesto. Un barbero no
 * responde de la sucursal y un admin no tiene silla que se le pare: enseñarles
 * el aviso del otro es ruido que nunca van a poder resolver.
 */
export function alertsForRole(role: TeamRoleFilter): readonly TeamAlertPreset[] {
  if (role === ALL_ROLES) return TEAM_ALERTS.filter((alert) => alert.scope === "person");
  return TEAM_ALERTS.filter((alert) => alert.roles.includes(role));
}
