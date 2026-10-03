/**
 * El equipo del backend simulado: las personas de las cuatro sucursales con
 * todo lo que guarda su ficha (perfil, servicios, compensación o pagos,
 * horario fijo, permisos y opciones), los niveles, el orden de los barberos
 * y las excepciones de horario de una semana concreta.
 *
 * Son las mismas 25 personas del home de equipo (`features/team/teamHome.tsx`)
 * con los mismos ids, para que la lista y la ficha hablen de la misma gente.
 */

export type MockTeamRole = "owner" | "admin" | "recepcion" | "barbero-comision" | "barbero-renta";
export type MockTeamStatus = "active" | "invited" | "inactive";

export interface MockWorkingRange {
  start: string;
  end: string;
}

export interface MockLevel {
  id: string;
  name: string;
}

export interface MockServiceOverride {
  serviceId: string;
  offered: boolean;
  price: number | null;
  newClientPrice: number | null;
  loyaltyPrice: number | null;
  durationMin: number | null;
  splitCommission: number | null;
  extraCommission: number | null;
}

export type MockCompensationType = "commission" | "scale" | "salary";

export interface MockCompensation {
  type: MockCompensationType;
  basic: number;
  recurring: number | null;
  walkIn: number | null;
  noPreference: number | null;
  newClient: number | null;
  productPercent: number | null;
  salary: number | null;
  scale: { from: number; percent: number }[];
}

export interface MockPayments {
  rentBase: number;
  walkInDeduction: number;
  newClientDeduction: number;
  noPreferenceDeduction: number;
  bankName: string;
  accountNumber: string;
}

export type MockPermissionColumn = "view" | "create" | "edit" | "delete" | "active";
export type MockPermissions = Record<string, Partial<Record<MockPermissionColumn, boolean>>>;

export type MockReminderChannel = "email" | "sms" | "push";

export interface MockMemberOptions {
  tips: boolean;
  multipleAppointments: boolean;
  newClients: boolean;
  clientCancel: { enabled: boolean; channels: MockReminderChannel[]; hours: number; minutes: number };
  intervalMinutes: number;
  reminders: { channel: MockReminderChannel; hours: number; minutes: number }[];
  social: string;
  link: string;
}

export interface MockTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: MockTeamRole;
  /** Sucursal de origen: donde se creó. */
  homeBranchId: string;
  /** Sucursales donde está activa. */
  branchIds: string[];
  status: MockTeamStatus;
  avatarUrl: string | null;
  /** El código personal; dato sensible. */
  code: string;
  description: string;
  bookingVisible: boolean;
  levelId: string | null;
  skills: string[];
  gallery: string[];
  /** Un gerente que además atiende. */
  isAlsoBarber: boolean;
  services: MockServiceOverride[];
  compensation: MockCompensation | null;
  payments: MockPayments | null;
  /** Horario fijo por día de la semana (0 = domingo); `null` = no trabaja. */
  schedule: Record<string, MockWorkingRange | null>;
  permissions: MockPermissions;
  options: MockMemberOptions;
  createdAt: string;
}

export interface MockLineupEntry {
  memberId: string;
  enabled: boolean;
}

export interface MockBranchOrder {
  branchId: string;
  calendar: string[];
  walkIn: MockLineupEntry[];
  noPreference: MockLineupEntry[];
}

export interface MockScheduleOverride {
  id: string;
  memberId: string;
  /** AAAA-MM-DD. */
  date: string;
  /** `null` = ese día no trabaja. */
  range: MockWorkingRange | null;
}

/* ------------------------------------------------------------- permisos */

/**
 * La matriz: cada fila dice qué columnas tiene. Los ids son estables y el
 * front los traduce. Es la misma matriz de Configuración › Permisos.
 */
export const PERMISSION_ROWS: readonly { id: string; block: string; columns: readonly MockPermissionColumn[] }[] = [
  { id: "calendar", block: "bookings", columns: ["active"] },
  { id: "appointments", block: "bookings", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "block-calendar", block: "bookings", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "clients", block: "bookings", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "client-info", block: "bookings", columns: ["active"] },
  { id: "import-clients", block: "bookings", columns: ["active"] },
  { id: "export-clients", block: "bookings", columns: ["active"] },
  { id: "team", block: "team", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "managers", block: "team", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "barber-payments", block: "team", columns: ["view", "create", "edit", "active"] },
  { id: "levels", block: "team", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "lineup", block: "team", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "barber-order", block: "team", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "kpis", block: "metrics", columns: ["active"] },
  { id: "products", block: "inventory", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "product-categories", block: "inventory", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "services", block: "services", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "service-categories", block: "services", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "service-lineup", block: "services", columns: ["view", "edit", "active"] },
  { id: "prices", block: "pos", columns: ["active"] },
  { id: "closures", block: "business", columns: ["view", "create", "edit", "delete", "active"] },
  { id: "payroll", block: "business", columns: ["view", "create", "edit"] },
  { id: "permissions", block: "business", columns: ["view", "edit", "active"] },
  { id: "account-settings", block: "business", columns: ["view", "edit", "active"] },
  { id: "expenses", block: "business", columns: ["view", "create", "edit", "delete", "active"] },
];

const full = (id: string): MockPermissions => {
  const row = PERMISSION_ROWS.find((item) => item.id === id);
  return { [id]: Object.fromEntries((row?.columns ?? []).map((column) => [column, true])) };
};
const some = (id: string, columns: readonly MockPermissionColumn[]): MockPermissions => ({ [id]: Object.fromEntries(columns.map((column) => [column, true])) });
const merge = (...parts: MockPermissions[]): MockPermissions => Object.assign({}, ...parts);

const BOOKINGS_FULL = merge(full("calendar"), full("appointments"), full("block-calendar"), full("clients"), full("client-info"), full("import-clients"), full("export-clients"));

/** Los permisos de fábrica de cada rol (help: tabla de permisos por rol). */
export const ROLE_PERMISSION_DEFAULTS: Readonly<Record<MockTeamRole, MockPermissions>> = {
  owner: merge(...PERMISSION_ROWS.map((row) => full(row.id))),
  admin: merge(...PERMISSION_ROWS.filter((row) => row.id !== "barber-payments" && row.id !== "barber-order").map((row) => full(row.id))),
  recepcion: merge(BOOKINGS_FULL, full("kpis"), some("products", ["view", "active"]), some("product-categories", ["view", "active"]), some("services", ["view", "active"]), full("prices")),
  "barbero-comision": merge(
    full("calendar"),
    full("appointments"),
    full("block-calendar"),
    some("clients", ["view", "create", "active"]),
    some("team", ["view"]),
    full("prices"),
    some("account-settings", ["view"]),
    full("expenses")
  ),
  "barbero-renta": merge(
    full("calendar"),
    full("appointments"),
    some("block-calendar", ["view"]),
    some("clients", ["view", "create", "active"]),
    full("prices"),
    some("account-settings", ["view"]),
    full("expenses")
  ),
};

/* -------------------------------------------------------------- niveles */

export const LEVELS: readonly MockLevel[] = [
  { id: "lvl_aprendiz", name: "Aprendiz" },
  { id: "lvl_junior", name: "Junior" },
  { id: "lvl_senior", name: "Senior" },
  { id: "lvl_master", name: "Master" },
];

/* ------------------------------------------------------------- personas */

const DEFAULT_OPTIONS: MockMemberOptions = {
  tips: true,
  multipleAppointments: false,
  newClients: true,
  clientCancel: { enabled: true, channels: ["sms", "push"], hours: 2, minutes: 0 },
  intervalMinutes: 30,
  reminders: [{ channel: "push", hours: 0, minutes: 15 }],
  social: "",
  link: "",
};

const DEFAULT_COMMISSION: MockCompensation = { type: "commission", basic: 40, recurring: 45, walkIn: 35, noPreference: 35, newClient: 50, productPercent: 10, salary: null, scale: [] };

const DEFAULT_PAYMENTS: MockPayments = { rentBase: 320, walkInDeduction: 20, newClientDeduction: 20, noPreferenceDeduction: 15, bankName: "Bank of America", accountNumber: "**** 4471" };

type Days = readonly number[];
const MON_SAT: Days = [1, 2, 3, 4, 5, 6];
const MON_FRI: Days = [1, 2, 3, 4, 5];
const TUE_SAT: Days = [2, 3, 4, 5, 6];
const WED_SAT: Days = [3, 4, 5, 6];

const week = (days: Days, start: string, end: string, extra: Record<string, MockWorkingRange | null> = {}): Record<string, MockWorkingRange | null> => ({
  ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((day) => [String(day), days.includes(day) ? { start, end } : null])),
  ...extra,
});

const NO_SCHEDULE = week([], "09:00", "18:00");

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ".");

interface Draft {
  status?: MockTeamStatus;
  levelId?: string | null;
  schedule?: Record<string, MockWorkingRange | null>;
  branchIds?: string[];
  isAlsoBarber?: boolean;
  description?: string;
  skills?: string[];
  bookingVisible?: boolean;
  compensation?: Partial<MockCompensation>;
  payments?: Partial<MockPayments>;
  options?: Partial<MockMemberOptions>;
}

function person(index: number, firstName: string, lastName: string, role: MockTeamRole, branchId: string, draft: Draft = {}): MockTeamMember {
  const isBarber = role === "barbero-comision" || role === "barbero-renta";
  const id = `team-${String(index).padStart(2, "0")}`;
  return {
    id,
    firstName,
    lastName,
    email: `${slug(`${firstName} ${lastName}`)}@barberia.com`,
    phone: `+1 617 555 0${String(100 + index).slice(-3)}`,
    role,
    homeBranchId: branchId,
    branchIds: draft.branchIds ?? (role === "owner" ? ["ma", "nc", "ri", "ut"] : [branchId]),
    status: draft.status ?? "active",
    avatarUrl: null,
    code: String(4000 + index * 7),
    description: draft.description ?? "",
    bookingVisible: draft.bookingVisible ?? true,
    levelId: isBarber ? (draft.levelId === undefined ? "lvl_senior" : draft.levelId) : null,
    skills: draft.skills ?? (isBarber ? ["Corte clásico", "Barba"] : []),
    gallery: [],
    isAlsoBarber: draft.isAlsoBarber ?? false,
    services: [],
    compensation: role === "barbero-comision" ? { ...DEFAULT_COMMISSION, ...draft.compensation } : null,
    payments: role === "barbero-renta" ? { ...DEFAULT_PAYMENTS, ...draft.payments } : null,
    schedule: draft.schedule ?? (isBarber ? week(MON_SAT, "09:00", "18:00") : NO_SCHEDULE),
    permissions: ROLE_PERMISSION_DEFAULTS[role],
    options: { ...DEFAULT_OPTIONS, ...draft.options },
    createdAt: new Date(Date.UTC(2026, 0, 6 + index * 3)).toISOString(),
  };
}

export function seedTeam(): MockTeamMember[] {
  return [
    person(1, "Carolina", "Vargas", "owner", "ma", { isAlsoBarber: false }),
    person(2, "Mateo", "Herrera", "admin", "ma"),
    person(3, "Lucía", "Bernal", "recepcion", "ma"),
    person(4, "Andrés", "Beltrán", "barbero-comision", "ma", { levelId: "lvl_master", schedule: week(MON_SAT, "09:00", "19:00"), description: "Especialista en corte clásico y barba a navaja.", skills: ["Corte clásico", "Barba a navaja", "Fade"], compensation: { basic: 45, recurring: 50 } }),
    person(29, "Emilio", "Arango", "barbero-comision", "ma", { levelId: "lvl_junior", schedule: week(MON_SAT, "10:00", "19:00"), skills: ["Corte clásico", "Fade"] }),
    person(30, "Paola", "Zuluaga", "barbero-renta", "ma", { levelId: "lvl_senior", schedule: week(TUE_SAT, "09:00", "17:00"), skills: ["Barba a navaja", "Diseño"] }),
    person(5, "Nicolás", "Duarte", "barbero-comision", "ma", { levelId: "lvl_senior", schedule: week(TUE_SAT, "10:00", "20:00"), skills: ["Fade", "Diseño"] }),
    person(6, "Valeria", "Marín", "barbero-renta", "ma", { levelId: "lvl_master", schedule: week(MON_FRI, "08:00", "16:00"), bookingVisible: true, options: { newClients: false } }),
    person(7, "Tomás", "Peña", "barbero-renta", "ma", { levelId: "lvl_junior", schedule: week(WED_SAT, "12:00", "22:00") }),
    person(8, "Daniela", "Osorio", "barbero-comision", "ma", { levelId: "lvl_senior", schedule: week(MON_SAT, "09:00", "18:00", { "3": { start: "09:00", end: "13:00" } }), skills: ["Color", "Tratamientos"], compensation: { type: "salary", salary: 650 } }),
    person(9, "Julián", "Cifuentes", "barbero-comision", "ma", { status: "invited", levelId: "lvl_aprendiz", schedule: NO_SCHEDULE, skills: [] }),
    // Massachusetts es la sucursal grande a propósito: con once barberos la
    // agenda del día no cabe en pantalla y se desplaza a lo ancho (diez trabajando un viernes).
    person(26, "Samuel", "Pardo", "barbero-comision", "ma", { levelId: "lvl_senior", schedule: week(MON_SAT, "09:00", "18:00"), skills: ["Fade", "Barba"] }),
    person(27, "Martín", "Quiroga", "barbero-renta", "ma", { levelId: "lvl_junior", schedule: week(TUE_SAT, "11:00", "20:00"), skills: ["Corte clásico"] }),
    person(28, "Lorena", "Lemos", "barbero-comision", "ma", { levelId: "lvl_master", schedule: week(MON_FRI, "08:00", "17:00"), skills: ["Color", "Diseño", "Tratamientos"], compensation: { basic: 45, recurring: 50 } }),

    person(10, "Valentina", "Ruiz", "admin", "nc"),
    person(11, "Camilo", "Restrepo", "barbero-comision", "nc", { levelId: "lvl_senior", schedule: week(MON_SAT, "09:00", "18:00") }),
    person(12, "Manuela", "Salgado", "barbero-renta", "nc", { levelId: "lvl_master", schedule: week(TUE_SAT, "11:00", "20:00") }),
    person(13, "Esteban", "Lara", "barbero-renta", "nc", { levelId: "lvl_junior", schedule: week(MON_FRI, "10:00", "17:00") }),
    person(14, "Paula", "Cárdenas", "recepcion", "nc"),
    person(15, "Samuel", "Ortiz", "barbero-comision", "nc", { status: "invited", levelId: null, schedule: NO_SCHEDULE }),

    person(16, "Diego", "Salazar", "admin", "ri"),
    person(17, "Renata", "Méndez", "recepcion", "ri"),
    person(18, "Juliana", "Prieto", "barbero-comision", "ri", { levelId: "lvl_master", schedule: week(MON_SAT, "09:00", "18:00") }),
    person(19, "Felipe", "Guzmán", "barbero-comision", "ri", { levelId: "lvl_senior", schedule: week(TUE_SAT, "12:00", "21:00") }),
    person(20, "Antonia", "Vélez", "barbero-renta", "ri", { levelId: "lvl_senior", schedule: week(MON_FRI, "08:00", "15:00") }),
    person(21, "Rubén", "Castaño", "barbero-renta", "ri", { status: "inactive", levelId: "lvl_junior", schedule: NO_SCHEDULE }),

    person(22, "Ana", "Torres", "admin", "ut"),
    person(23, "Santiago", "Rico", "barbero-comision", "ut", { levelId: "lvl_senior", schedule: week(MON_SAT, "09:00", "18:00") }),
    person(24, "Gabriela", "Nieto", "barbero-renta", "ut", { levelId: "lvl_master", schedule: week(TUE_SAT, "10:00", "19:00") }),
    person(25, "Isabella", "Franco", "recepcion", "ut", { status: "invited" }),
  ];
}

export const isBarberRole = (role: MockTeamRole): boolean => role === "barbero-comision" || role === "barbero-renta";

/** Los barberos activos en una sucursal, en su orden de calendario. */
export function barbersOf(members: readonly MockTeamMember[], orders: readonly MockBranchOrder[], branchId: string): MockTeamMember[] {
  const order = orders.find((item) => item.branchId === branchId)?.calendar ?? [];
  const list = members.filter((member) => (isBarberRole(member.role) || member.isAlsoBarber) && member.status !== "inactive" && member.branchIds.includes(branchId));
  return [...list].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
  });
}

export function seedOrders(members: readonly MockTeamMember[]): MockBranchOrder[] {
  return ["ma", "nc", "ri", "ut"].map((branchId) => {
    const ids = members.filter((member) => isBarberRole(member.role) && member.branchIds.includes(branchId)).map((member) => member.id);
    return {
      branchId,
      calendar: ids,
      walkIn: ids.map((memberId, index) => ({ memberId, enabled: index % 3 !== 2 })),
      noPreference: ids.map((memberId, index) => ({ memberId, enabled: index % 4 !== 3 })),
    };
  });
}

/** Una semana con dos excepciones para que se vean. */
export function seedOverrides(): MockScheduleOverride[] {
  return [
    { id: "ovr_1", memberId: "team-05", date: "2026-09-26", range: null },
    { id: "ovr_2", memberId: "team-04", date: "2026-09-28", range: { start: "12:00", end: "19:00" } },
  ];
}

export const memberName = (member: Pick<MockTeamMember, "firstName" | "lastName">): string => `${member.firstName} ${member.lastName}`;
