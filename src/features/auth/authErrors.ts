import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/api";

/** Pinta en su campo los errores `fields` del servidor. Devuelve si había alguno. */
export function applyServerFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  const fields = isApiError(error) ? error.fieldErrors : undefined;
  if (!fields) return false;
  for (const [name, messages] of Object.entries(fields)) {
    setError(name as Path<T>, { type: "server", message: messages[0] });
  }
  return true;
}

/** El backend bloquea un celular tras varios intentos fallidos con `429` + `details.reason: "locked"`. */
export function isLockedError(error: unknown): boolean {
  if (!isApiError(error) || error.code !== "rate_limited") return false;
  const details = error.details;
  return !!details && typeof details === "object" && (details as { reason?: unknown }).reason === "locked";
}

/** Intentos que quedan antes del bloqueo, si el backend los informó. */
export function attemptsLeftFrom(error: unknown): number | null {
  if (!isApiError(error) || !error.details || typeof error.details !== "object") return null;
  const value = (error.details as { attemptsLeft?: unknown }).attemptsLeft;
  return typeof value === "number" ? value : null;
}

/** Cuántos segundos faltan para poder intentarlo otra vez, si el backend lo dijo (bloqueo). */
export function retryAfterFrom(error: unknown): number | null {
  if (!isApiError(error) || !error.details || typeof error.details !== "object") return null;
  const value = (error.details as { retryAfterSeconds?: unknown }).retryAfterSeconds;
  return typeof value === "number" && value >= 0 ? value : null;
}
