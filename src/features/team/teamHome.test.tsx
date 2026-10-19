import { describe, expect, test } from "vitest";
import {
  ALL_ROLES,
  IDLE_OCCUPANCY,
  ROLE_BY_ID,
  TEAM_ALERTS,
  TEAM_MEMBERS,
  TEAM_ROLES,
  alertsForRole,
  isManagerRole,
  isWorkingBarber,
  membersOfRole,
  teamMetrics,
} from "./teamHome";

/**
 * El home de equipo promete dos cosas: que sus cifras salen de las filas que
 * están abajo y que cada aviso solo señala a los roles a los que de verdad le
 * puede pasar. Las dos se rompen en silencio, así que se prueban.
 */
describe("datos del home de equipo", () => {
  test("cada aviso solo alcanza a los roles que declara", () => {
    for (const alert of TEAM_ALERTS) {
      const alcanzados = TEAM_MEMBERS.filter((member) => alert.matches(member)).map((member) => member.role);
      for (const role of alcanzados) {
        expect(alert.roles, `${alert.id} señaló a un ${role}`).toContain(role);
      }
    }
  });

  test("todos los avisos tienen a quién señalar", () => {
    // Un aviso que nunca se enciende no se puede revisar ni en la pantalla ni
    // en una captura: los datos de ejemplo tienen que ejercitarlos todos.
    for (const alert of TEAM_ALERTS) {
      expect(TEAM_MEMBERS.filter((member) => alert.matches(member)).length, alert.id).toBeGreaterThan(0);
    }
  });

  test("la silla parada no se cuenta a quien no atiende", () => {
    const idle = TEAM_ALERTS.find((alert) => alert.id === "idle");
    for (const member of TEAM_MEMBERS.filter((item) => idle?.matches(item))) {
      expect(ROLE_BY_ID[member.role].worksChair).toBe(true);
      expect(member.occupancy).toBeLessThan(IDLE_OCCUPANCY);
    }
  });

  test("las métricas son las de los barberos activos, no las de todo el equipo", () => {
    const working = TEAM_MEMBERS.filter(isWorkingBarber);
    const [ocupacion, servicios] = teamMetrics();

    expect(servicios.value).toBe(working.reduce((total, member) => total + (member.services ?? 0), 0));
    const promedio = working.reduce((total, member) => total + (member.occupancy ?? 0), 0) / working.length;
    expect(ocupacion.value).toBeCloseTo(promedio, 1);
  });

  test("la serie de cada métrica cierra con el valor de esta semana", () => {
    for (const metric of teamMetrics()) {
      expect(metric.series.at(-1)?.value, metric.id).toBe(metric.value);
    }
  });

  test("a quien no corta no se le enseñan métricas de silla", () => {
    // Un owner no tiene agenda propia: «ocupación de sillas» le daría cero y
    // parecería un problema cuando es que la lectura no es suya.
    const sillas = teamMetrics().map((item) => item.id);
    for (const role of TEAM_ROLES.filter((item) => !item.worksChair)) {
      const ids = teamMetrics(role.id).map((item) => item.id);
      expect(ids, role.id).not.toEqual(sillas);
      for (const metric of teamMetrics(role.id)) {
        expect(metric.basis, `${role.id} / ${metric.id}`).toBeGreaterThan(0);
      }
    }
  });

  test("las métricas de quien atiende se recortan a su rol", () => {
    for (const role of TEAM_ROLES.filter((item) => item.worksChair)) {
      const suyos = membersOfRole(role.id).filter(isWorkingBarber);
      const [, servicios] = teamMetrics(role.id);
      expect(servicios.value, role.id).toBe(suyos.reduce((total, member) => total + (member.services ?? 0), 0));
    }
  });

  test("cada rol solo recibe avisos que puede resolver", () => {
    for (const role of TEAM_ROLES) {
      for (const alert of alertsForRole(role.id)) {
        expect(alert.roles, `${alert.id} se le ofreció a un ${role.id}`).toContain(role.id);
      }
    }
  });

  test("los avisos de gestión solo señalan a quien responde por otros", () => {
    // Si un aviso de «lo que maneja» alcanzara a un barbero, le estaría
    // pidiendo que resuelva algo que no está en su mano.
    for (const alert of TEAM_ALERTS.filter((item) => item.scope === "managed")) {
      for (const member of TEAM_MEMBERS.filter((member) => alert.matches(member))) {
        expect(isManagerRole(member.role), `${alert.id} / ${member.role}`).toBe(true);
      }
    }
  });

  test("en «Todos» no se cuenta el mismo problema dos veces", () => {
    // La silla parada la tiene el barbero y la tiene a cargo su admin: sin el
    // rol puesto, la pantalla mira a cada quien como individuo.
    for (const alert of alertsForRole(ALL_ROLES)) {
      expect(alert.scope, alert.id).toBe("person");
    }
  });

  test("cada rol de la plataforma tiene gente y ficha", () => {
    for (const role of TEAM_ROLES) {
      expect(ROLE_BY_ID[role.id]).toBe(role);
      expect(TEAM_MEMBERS.filter((member) => member.role === role.id).length, role.id).toBeGreaterThan(0);
    }
  });
});
