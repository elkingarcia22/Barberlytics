import { ApiError, env } from "@/lib/api";
import type { AuthProvider } from "./types";

/** Credencial que el backend simulado acepta sin mirar. */
const MOCK_CREDENTIAL = "mock-credential";

/**
 * Pide al proveedor (Google Identity Services, MSAL para Outlook) la
 * credencial con la que el backend abre la sesión. Con el backend simulado
 * devuelve una credencial de mentira; sin él, todavía no hay SDK conectado y
 * se avisa con un error normal de la API para que la pantalla lo muestre.
 */
export async function requestProviderCredential(provider: AuthProvider): Promise<string> {
  if (env.useMocks) return MOCK_CREDENTIAL;
  throw new ApiError({ status: 0, code: "unknown", message: `Entrar con ${provider} no está configurado en este entorno.` });
}
