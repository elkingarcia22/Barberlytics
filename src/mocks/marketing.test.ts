import { beforeEach, describe, expect, test } from "vitest";
import { db } from "./db";
import { buildMarketingMetrics } from "./metricsTabs";
import { dayRecord, daysOf } from "./metrics";
import { periodRange } from "@/components/date/periodRange";

const QUERY = { granularity: "month" as const, date: "2026-09-15", barberId: "all", branchId: "ma" };

describe("Métricas › Marketing con el origen real de cada cita", () => {
  beforeEach(() => db.reset());

  test("los canales y las campañas cuadran con las citas en línea y su utm guardado", () => {
    const data = buildMarketingMetrics(QUERY);
    const range = periodRange(new Date(2026, 8, 15), "month");
    const online = daysOf(range).flatMap((date) => dayRecord(date, "all", "ma").appointments).filter((item) => item.method === "online");
    expect(data.channels.reduce((total, channel) => total + channel.bookings, 0)).toBe(online.length);
    const withCampaign = online.filter((item) => item.utm?.campaign);
    expect(data.kpis.campaignBookings.value).toBe(withCampaign.length);
    const instagram = online.filter((item) => item.utm?.source === "instagram").length;
    expect(data.channels.find((channel) => channel.id === "instagram")?.bookings ?? 0).toBe(instagram);
    // Sin utm_source, «Directo»; y «Directo» no es el mejor canal de marketing.
    expect(data.channels.find((channel) => channel.id === "directo")?.bookings ?? 0).toBe(online.filter((item) => !item.utm?.source).length);
    expect(data.kpis.bestChannel).not.toBe("Directo");
  });

  test("lo mismo dos veces da lo mismo: nada sale al azar al consultar", () => {
    expect(buildMarketingMetrics(QUERY)).toEqual(buildMarketingMetrics(QUERY));
  });

  test("una campaña nueva en el enlace aparece con su nombre legible", () => {
    // La agenda se genera por día al pedirla: primero se pide el periodo.
    buildMarketingMetrics(QUERY);
    const appointment = db.calendar.appointments.find((item) => item.source === "online" && item.branchId === "ma" && item.start.startsWith("2026-09") && item.status !== "cancelled");
    expect(appointment).toBeDefined();
    if (!appointment) return;
    db.calendar.appointments = db.calendar.appointments.map((item) => (item.id === appointment.id ? { ...item, utm: { source: "tiktok", medium: "social", campaign: "black_friday-2026" } } : item));
    const data = buildMarketingMetrics(QUERY);
    expect(data.channels.find((channel) => channel.id === "tiktok")).toMatchObject({ name: "TikTok", bookings: 1 });
    expect(data.campaigns.find((campaign) => campaign.id === "black_friday-2026")).toMatchObject({ name: "Black friday 2026", bookings: 1 });
  });
});
