import { describe, expect, test } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { db } from "@/mocks/db";
import { appointmentsOn } from "@/mocks/calendar/handlers";
import { ChatActionCard } from "@/components/chat/ChatActionCard";
import { PROPOSERS, ProposalError, runClipperAction, type ProposalContext } from "./proposals";
import { runClipperTool } from "./tools";

/** Un día futuro: sus citas siguen agendadas y se pueden mover o cancelar. */
const DAY = (() => {
  const date = new Date(Date.now() + 3 * 86_400_000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
})();
const context: ProposalContext = { branchId: "ma", locale: "es", t: (key) => key };
const signal = () => new AbortController().signal;

function signIn() {
  db.sessions.set("mock-acc_admin-proposals", "acc_admin");
  renderWithProviders(<div />, { token: "mock-acc_admin-proposals" });
}

const scheduled = () => appointmentsOn("ma", DAY).find((item) => item.status === "scheduled" && !item.walkIn)!;
const stored = (id: string) => db.calendar.appointments.find((item) => item.id === id)!;

describe("propuestas de Clipper", () => {
  test("mover: proponer no cambia nada; aplicar mueve con Clipper en el historial; deshacer la devuelve", async () => {
    signIn();
    const appointment = scheduled();
    const action = await PROPOSERS.proponer_mover_cita({ citaId: appointment.id, fechaActual: DAY, inicio: `${DAY}T21:30`, motivo: "Lo pidió el cliente" }, context, signal());
    expect(action).toMatchObject({ kind: "moveAppointment", status: "proposed" });
    expect(action.rows.find((row) => row.label === "clipper.action.when")?.before).not.toBe(action.rows.find((row) => row.label === "clipper.action.when")?.after);
    expect(stored(appointment.id).start).toBe(appointment.start);

    const applied = await runClipperAction(action, "apply");
    expect(applied.status).toBe("applied");
    expect(stored(appointment.id).start).toBe(`${DAY}T21:30:00`);
    const history = stored(appointment.id).history.map((entry) => `${entry.actor}|${entry.event}`);
    expect(history.some((entry) => entry.startsWith("Clipper · ") && entry.includes("moved:"))).toBe(true);
    expect(history.some((entry) => entry.endsWith("reason:Lo pidió el cliente"))).toBe(true);

    expect((await runClipperAction({ ...action, ...applied }, "undo")).status).toBe("undone");
    expect(stored(appointment.id).start).toBe(appointment.start);
  });

  test("cancelar y deshacer; una cita cobrada no se propone", async () => {
    signIn();
    const appointment = scheduled();
    const action = await PROPOSERS.proponer_cancelar_cita({ citaId: appointment.id, fechaActual: DAY }, context, signal());
    const applied = await runClipperAction(action, "apply");
    expect(stored(appointment.id).status).toBe("cancelled");
    await runClipperAction({ ...action, ...applied }, "undo");
    expect(stored(appointment.id).status).toBe("scheduled");

    const past = appointmentsOn("ma", "2026-09-22").find((item) => item.status === "paid")!;
    await expect(PROPOSERS.proponer_cancelar_cita({ citaId: past.id, fechaActual: "2026-09-22" }, context, signal())).rejects.toBeInstanceOf(ProposalError);
  });

  test("cita nueva, bloqueo y nota: se aplican y se deshacen", async () => {
    signIn();
    const appointment = scheduled();
    const service = db.services.items[0];
    const created = await PROPOSERS.proponer_cita({ clienteId: appointment.clientId, barberoId: appointment.barberId, servicioIds: [service.id], inicio: `${DAY}T22:00` }, context, signal());
    const createdApplied = await runClipperAction(created, "apply");
    const newId = createdApplied.undo!.appointmentId as string;
    expect(stored(newId).createdBy).toMatch(/^Clipper · /);
    await runClipperAction({ ...created, ...createdApplied }, "undo");
    expect(stored(newId).status).toBe("cancelled");

    const block = await PROPOSERS.proponer_bloqueo({ barberoId: appointment.barberId, fecha: DAY, desde: "00:00", hasta: "23:30", tipo: "meeting" }, context, signal());
    expect(block.warnings?.[0]).toBe("clipper.action.blockClash");
    const blockApplied = await runClipperAction(block, "apply");
    expect(db.calendar.blocks.some((item) => item.id === blockApplied.undo!.blockId)).toBe(true);
    await runClipperAction({ ...block, ...blockApplied }, "undo");
    expect(db.calendar.blocks.some((item) => item.id === blockApplied.undo!.blockId)).toBe(false);

    const note = await PROPOSERS.proponer_nota_cliente({ clienteId: appointment.clientId, texto: "Alérgico al látex", tipo: "allergy" }, context, signal());
    expect(note.warnings).toEqual(["clipper.action.health"]);
    const noteApplied = await runClipperAction(note, "apply");
    const client = () => db.calendar.clients.find((item) => item.id === appointment.clientId)!;
    expect(client().notes[0]).toMatchObject({ kind: "allergy", text: "Alérgico al látex" });
    await runClipperAction({ ...note, ...noteApplied }, "undo");
    expect(client().notes.some((item) => item.text === "Alérgico al látex")).toBe(false);
  });

  test("como herramienta: la propuesta va a la respuesta y el modelo sabe que falta «Aplicar»", async () => {
    signIn();
    const appointment = scheduled();
    const proposed: unknown[] = [];
    const result = await runClipperTool("proponer_cancelar_cita", { citaId: appointment.id, fechaActual: DAY }, { branchId: "ma", role: "recepcion", memberId: null, today: DAY, locale: "es", t: (key) => key }, signal(), (action) => proposed.push(action));
    expect(proposed).toHaveLength(1);
    expect(JSON.parse(result.content).estado).toMatch(/Aplicar/);
    expect(stored(appointment.id).status).toBe("scheduled");
    const bad = await runClipperTool("proponer_cancelar_cita", { citaId: "nada", fechaActual: DAY }, { branchId: "ma", role: "recepcion", memberId: null, today: DAY, locale: "es", t: (key) => key }, signal(), () => {});
    expect(bad.isError).toBe(true);
  });

  test("la tarjeta muestra el antes y el después; aplicada, ofrece deshacer", async () => {
    const action = { id: "a1", kind: "moveAppointment", title: "Mover la cita", rows: [{ label: "Cuándo", before: "vie 10:00", after: "vie 16:00" }], payload: {}, status: "proposed" as const };
    let applied = 0;
    const { rerender } = renderWithProviders(<ChatActionCard action={action} onApply={() => applied++} onDiscard={() => {}} />);
    expect(screen.getByText("vie 10:00")).toHaveClass("line-through");
    await userEvent.setup().click(screen.getByTestId("chat-action-apply"));
    expect(applied).toBe(1);
    rerender(<ChatActionCard action={{ ...action, status: "applied", undo: { appointmentId: "x" } }} onUndo={() => {}} />);
    expect(screen.getByTestId("chat-action-undo")).toBeInTheDocument();
  });
});
