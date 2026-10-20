import type { CreateDraft } from "./useCreateDraft";

/** Lo que recibe cada propuesta de «Crear cita»: el motor, la sucursal (para las horas libres) y crear un cliente. */
export interface CreateBodyProps {
  draft: CreateDraft;
  branchId: string;
  onCreateClient: () => void;
}
