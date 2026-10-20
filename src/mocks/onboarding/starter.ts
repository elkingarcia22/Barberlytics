import { COUNTRY_PACKS, DEFAULT_CLOSED_HOLIDAYS, findUsualTaxGroup, gatewaysFor, packCountryOf, type PackCountry } from "@/features/settings/countryPack";
import { defaultWeekHours } from "@/features/branches/branchHours";
import { allAccounts, db, type MockAccount } from "../db";
import { addMember, buildMember } from "../team/handlers";
import type { MockListItem } from "../settings/seed";

/**
 * La barbería que nace con el registro (docs/API_CONTRACT.md, «Registro»): no arranca vacía ni con lo de
 * Estados Unidos, sino con el paquete de su país. La sucursal ya tiene moneda, zona e idioma; el impuesto
 * habitual queda creado (Colombia IVA 19 %, México IVA 16 %; en EE. UU. depende del estado y no se crea); los
 * festivos habituales del país quedan como días sin reserva, y la persona que se registra es la dueña.
 *
 * El backend simulado tiene una sola barbería: la sucursal nueva se suma a la de la demo, y la cuenta entra
 * a ella. En el real cada registro es una barbería aparte (`tenant_id`).
 */

export interface SignupInput {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
}

/** Lo que quedó listo, para decírselo a la persona al entrar. */
export interface StarterSummary {
  branchId: string;
  country: PackCountry | null;
  currency: string;
  timezone: string;
  taxGroup: string | null;
  holidays: number;
  gateways: readonly string[];
}

const digits = (value: string): string => value.replace(/\D/g, "");

/** Si ese celular ya es de una cuenta o de alguien del equipo (el mismo número no abre dos cuentas). */
export function phoneTaken(phone: string): boolean {
  const wanted = digits(phone);
  return allAccounts().some((account) => digits(account.phone) === wanted) || db.team.members.some((member) => digits(member.phone) === wanted);
}

/** Si ese correo ya es de una cuenta o de alguien del equipo. */
export function emailTaken(email: string): boolean {
  const wanted = email.trim().toLowerCase();
  return allAccounts().some((account) => account.email === wanted) || db.team.members.some((member) => member.email.toLowerCase() === wanted);
}

/** El nombre de la sucursal: el de la barbería; si ya hay una así, con un número. */
function freeBranchName(name: string): string {
  const taken = new Set(db.settings.lists.branches.map((item) => String(item.name).toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  let index = 2;
  while (taken.has(`${name} ${index}`.toLowerCase())) index += 1;
  return `${name} ${index}`;
}

/** El impuesto habitual del país: el que ya exista con ese nombre o uno nuevo. */
function usualTaxGroup(country: PackCountry): MockListItem | null {
  const usual = COUNTRY_PACKS[country].taxGroup;
  if (!usual) return null;
  const groups = db.settings.lists.taxGroups.map((item) => ({ item, name: String(item.name), taxes: (item.taxes as { name: string; percent: number }[] | undefined) ?? [] }));
  const existing = findUsualTaxGroup(country, groups)?.item;
  if (existing) return existing;
  const created: MockListItem = { id: `tax_${country.toLowerCase()}_${Date.now().toString(36)}`, name: usual.name, taxes: usual.taxes.map((tax) => ({ ...tax })) };
  db.settings.lists.taxGroups = [...db.settings.lists.taxGroups, created];
  return created;
}

/** Crea la sucursal con el paquete del país, el impuesto habitual, los festivos, la ficha de la dueña y la cuenta. */
export function startBarbershop(input: SignupInput, now: Date = new Date()): { account: MockAccount; summary: StarterSummary } {
  const country = packCountryOf(input.country);
  const pack = country ? COUNTRY_PACKS[country] : null;
  const timezone = input.timezone || pack?.timezones[0] || "America/New_York";
  const tax = country ? usualTaxGroup(country) : null;
  const branchId = `br_${now.getTime().toString(36)}`;
  const branch: MockListItem = {
    id: branchId,
    name: freeBranchName(input.company),
    legalName: input.company,
    taxId: "",
    country: country ?? input.country,
    state: "",
    city: "",
    address: "",
    zipcode: "",
    phone: input.phone,
    currency: pack?.currency ?? "USD",
    language: pack?.language ?? "es",
    timezone,
    taxGroupId: tax?.id ?? null,
    gatewayId: null,
    description: "",
    // Lunes a sábado con el horario del negocio; cada día se ajusta en Configuración › Sucursales.
    hours: defaultWeekHours((db.settings.sections.business as { openTime?: string }).openTime, (db.settings.sections.business as { closeTime?: string }).closeTime),
    status: "active",
    createdAt: now.toISOString(),
  };
  db.settings.lists.branches = [...db.settings.lists.branches, branch];

  // Los festivos son por motivo: «independencia» cierra a cada sede el día de su país.
  const business = db.settings.sections.business as { holidays?: string[] };
  const usual = country ? DEFAULT_CLOSED_HOLIDAYS[country] : [];
  db.settings.sections.business = { ...business, holidays: [...new Set([...(business.holidays ?? []), ...usual])] };

  const member = { ...buildMember({}, "owner", { firstName: input.firstName, lastName: input.lastName, phone: input.phone, email: input.email, levelId: null }, branchId), branchIds: [branchId], status: "active" as const, lastInviteAt: undefined };
  addMember(member);

  const account: MockAccount = {
    id: `acc_${now.getTime().toString(36)}`,
    phone: input.phone,
    email: input.email,
    providers: [],
    user: { id: `usr_${now.getTime().toString(36)}`, name: `${input.firstName} ${input.lastName}`, phone: input.phone, email: input.email, role: "admin", avatarUrl: null, teamRole: "owner", memberId: member.id },
  };
  db.signups = [...db.signups, account];
  db.persist();

  return {
    account,
    summary: { branchId, country, currency: String(branch.currency), timezone, taxGroup: tax ? String(tax.name) : null, holidays: usual.length, gateways: country ? gatewaysFor(country).map((provider) => provider) : [] },
  };
}
