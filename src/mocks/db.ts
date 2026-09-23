/**
 * Base de datos en memoria del backend simulado. Es determinista: la misma
 * semilla produce los mismos registros, así las pruebas E2E y las capturas
 * son reproducibles. Se reinicia al recargar la página.
 */
export type MockUserStatus = "active" | "invited" | "inactive";
export type MockUserRole = "admin" | "manager" | "member";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  area: string;
  role: MockUserRole;
  status: MockUserStatus;
  createdAt: string;
  lastActiveAt: string | null;
  avatarUrl: string | null;
}

export interface MockAccount {
  id: string;
  email: string;
  password: string;
  user: { id: string; name: string; email: string; role: MockUserRole; avatarUrl: string | null };
}

const FIRST = ["Ana", "Luis", "María", "Carlos", "Antonia", "Andrés", "Valentina", "Diego", "Renata", "Mateo", "Camila", "Juan", "Daniela", "Santiago", "Paula", "Nicolás", "Isabella", "Sebastián", "Gabriela", "Tomás"];
const LAST = ["Pérez", "Gómez", "Ruiz", "Díaz", "Torres", "Rojas", "Castro", "Herrera", "Méndez", "Vargas", "Moreno", "Jiménez", "Ortiz", "Silva", "Ramírez"];
const AREAS = ["Producto", "Ingeniería", "Ventas", "Personas", "Marketing", "Finanzas", "Operaciones", "Soporte"];

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function seedUsers(count = 57, seed = 7): MockUser[] {
  const rand = seededRandom(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const base = Date.UTC(2026, 0, 6);
  return Array.from({ length: count }, (_, index) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const second = pick(LAST);
    const name = `${first} ${last} ${second}`;
    const status: MockUserStatus = rand() < 0.78 ? "active" : rand() < 0.5 ? "invited" : "inactive";
    const createdAt = new Date(base + Math.floor(rand() * 240) * 86_400_000).toISOString();
    return {
      id: `usr_${String(index + 1).padStart(4, "0")}`,
      name,
      email: `${slug(first)}.${slug(last)}${index}@empresa.com`,
      area: pick(AREAS),
      role: index === 0 ? "admin" : rand() < 0.15 ? "manager" : "member",
      status,
      createdAt,
      lastActiveAt: status === "invited" ? null : new Date(base + Math.floor(rand() * 260) * 86_400_000).toISOString(),
      avatarUrl: null,
    };
  });
}

export const ACCOUNTS: readonly MockAccount[] = [
  {
    id: "acc_admin",
    email: "admin@thema.dev",
    password: "thema123",
    user: { id: "usr_0001", name: "Carolina Vargas", email: "admin@thema.dev", role: "admin", avatarUrl: null },
  },
  {
    id: "acc_manager",
    email: "lider@thema.dev",
    password: "thema123",
    user: { id: "usr_0002", name: "Julián Ospina", email: "lider@thema.dev", role: "manager", avatarUrl: null },
  },
];

export interface MockDb {
  users: MockUser[];
  /** token → id de cuenta */
  sessions: Map<string, string>;
  /** Guarda el estado; se llama tras cada mutación para sobrevivir recargas. */
  persist(): void;
  reset(): void;
}

const STORAGE_KEY = "thema.mock.db";

interface PersistedDb {
  users: MockUser[];
  sessions: [string, string][];
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function load(): PersistedDb | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDb) : null;
  } catch {
    return null;
  }
}

/**
 * Como un backend real, el estado sobrevive a una recarga (en `sessionStorage`,
 * así muere al cerrar la pestaña). En Node (Vitest) no hay almacenamiento y
 * todo es efímero.
 */
export function createDb(): MockDb {
  const saved = load();
  const db: MockDb = {
    users: saved?.users ?? seedUsers(),
    sessions: new Map(saved?.sessions ?? []),
    persist() {
      try {
        storage()?.setItem(STORAGE_KEY, JSON.stringify({ users: db.users, sessions: [...db.sessions.entries()] } satisfies PersistedDb));
      } catch {
        /* sin almacenamiento: el estado vive solo en memoria */
      }
    },
    reset() {
      db.users = seedUsers();
      db.sessions.clear();
      try {
        storage()?.removeItem(STORAGE_KEY);
      } catch {
        /* nada que limpiar */
      }
    },
  };
  return db;
}

export const db = createDb();
