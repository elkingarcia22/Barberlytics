/**
 * La sucursal con la que entra la pestaña: el registro deja la que acaba de crear para que la cuenta nueva
 * aterrice en ella y no en la primera de la lista. Vive en `sessionStorage` (muere al cerrar la pestaña);
 * si falla el almacenamiento, se entra a la de siempre.
 */

const KEY = "thema.branch.initial";

export function rememberInitialBranch(branchId: string): void {
  try {
    window.sessionStorage.setItem(KEY, branchId);
  } catch {
    // Sin almacenamiento: entra a la sucursal por defecto.
  }
}

export function readInitialBranch(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
