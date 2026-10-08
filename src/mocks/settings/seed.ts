/**
 * La configuración del backend simulado. Dos formas de dato:
 *
 * - **Documentos**: un ajuste que es un solo objeto y se guarda entero
 *   (perfil del negocio, reservas, propinas…). Viven en `sections`.
 * - **Listas**: ajustes que son una colección con alta, edición y borrado
 *   (sucursales, cierres, impuestos, datáfonos). Viven en `lists`.
 *
 * Los enlaces y el identificador del widget son de mentira: los reales salen
 * de la cuenta y no se copian a un mock.
 */

export type MockSettingsSection = "business" | "booking" | "pricing" | "tips" | "cardFee" | "commissions" | "payrollCycle" | "payments" | "notifications" | "company" | "billing";
export type MockSettingsList = "branches" | "closures" | "taxGroups" | "devices";

export interface MockListItem {
  id: string;
  [key: string]: unknown;
}

export interface MockSettingsState {
  sections: Record<MockSettingsSection, Record<string, unknown>>;
  lists: Record<MockSettingsList, MockListItem[]>;
  /** La clave secreta de la pasarela: se guarda pero nunca se devuelve. */
  secretKey: string | null;
}

const DEMO_ACCOUNT = "demo-barberia";
const WIDGET_ID = "00000000-demo-0000-0000-000000000000";

export const DEFAULT_POLICY = [
  "Puedes reservar tu cita en línea cuando quieras.",
  "Para cancelar o reprogramar, hazlo con al menos <<time_for_cancel>> de antelación.",
  "Si cancelas más tarde se cobra el <<fee_cancellation>>% del servicio.",
  "Puedes cancelar en línea hasta <<max_cancellations>> veces; después tendrás que llamarnos.",
].join("\n");

export function seedSettings(): MockSettingsState {
  return {
    secretKey: null,
    sections: {
      business: { timezone: "America/New_York", timeFormat: "12h", weekStart: "monday", openTime: "09:00", closeTime: "19:00", holidays: ["new-year", "independence", "thanksgiving", "christmas"], website: "https://barberia.example.com", instagram: "https://instagram.com/barberlytics", facebook: "https://facebook.com/barberlytics", googleMaps: "" },
      booking: {
        minNotice: 30,
        minNoticeUnit: "minutes",
        slotInterval: 30,
        surge: { enabled: false, occupancy: 80, increase: 10, increaseType: "percent" },
        waitlist: { acceptMinutes: 15, arriveMinutes: 15 },
        paymentMethods: { card: true, payAtShop: true },
        cancelHours: 3,
        lateFeePercent: 10,
        maxCancellations: 5,
        policy: DEFAULT_POLICY,
        links: { widgetId: WIDGET_ID, scriptUrl: "https://widgets.example.com/barberia-widgets.js", bookingUrl: `https://reservas.example.com/book/${DEMO_ACCOUNT}`, frontDeskUrl: `https://reservas.example.com/front-desk/${DEMO_ACCOUNT}`, portalUrl: `https://reservas.example.com/portal/${DEMO_ACCOUNT}` },
      },
      pricing: { currency: "USD", taxInclusive: false },
      tips: { options: [{ id: "tip_1", type: "percent", value: 15 }, { id: "tip_2", type: "percent", value: 20 }, { id: "tip_3", type: "percent", value: 25 }, { id: "tip_4", type: "amount", value: 5 }], defaultId: "tip_2", checkout: "unset" },
      // Encendido en la demo: se ve en el cobro de la agenda y en la reserva en línea (pagar en la barbería lo evita).
      cardFee: { enabled: true, name: "Recargo por tarjeta", rate: 3, type: "percent" },
      commissions: { deductDiscounts: true, deductTaxes: true, deductServiceCost: false, deductProductCost: false },
      payrollCycle: { cycle: "weekly", startDay: 1 },
      payments: { provider: "stripe", publicKey: "", secretKeySet: false, connected: false },
      notifications: { toggles: {}, thresholds: {} },
      company: { name: "Barbería Demo", legalName: "Barbería Demo LLC", identification: "12-3456789", website: "https://barberia.example.com", phone: "+16175550100", country: "Estados Unidos" },
      billing: {
        plan: { name: "Grow", cycle: "annual", price: 50, nextInvoiceAt: "2026-10-28" },
        details: { name: "Barbería Demo LLC", address: "88 Newbury St", city: "Boston", state: "Massachusetts", email: "facturas@barberia.example.com" },
        method: { brand: "visa", last4: "4242" },
        invoices: [
          { id: "inv_002", concept: "Grow", total: 50, date: "2026-07-27" },
          { id: "inv_001", concept: "Grow (prueba gratis)", total: 0, date: "2026-05-25" },
        ],
      },
    },
    lists: {
      branches: [
        { id: "ma", name: "Massachusetts", legalName: "Barbería Demo LLC", taxId: "12-3456789", country: "Estados Unidos", state: "Massachusetts", city: "Boston", address: "88 Newbury St", zipcode: "02116", phone: "+16175550100", currency: "USD", language: "es", timezone: "America/New_York", description: "", status: "active", createdAt: "2026-01-06T12:00:00.000Z" },
        { id: "nc", name: "North Carolina", legalName: "Barbería Demo LLC", taxId: "12-3456789", country: "Estados Unidos", state: "North Carolina", city: "Charlotte", address: "210 W Trade St", zipcode: "28202", phone: "+17045550110", currency: "USD", language: "es", timezone: "America/New_York", description: "", status: "active", createdAt: "2026-02-10T12:00:00.000Z" },
        { id: "ri", name: "Rhode Island", legalName: "Barbería Demo LLC", taxId: "12-3456789", country: "Estados Unidos", state: "Rhode Island", city: "Providence", address: "134 Thayer St", zipcode: "02906", phone: "+14015550120", currency: "USD", language: "es", timezone: "America/New_York", description: "", status: "active", createdAt: "2026-03-18T12:00:00.000Z" },
        { id: "ut", name: "Utah", legalName: "Barbería Demo LLC", taxId: "12-3456789", country: "Estados Unidos", state: "Utah", city: "Salt Lake City", address: "55 W 200 S", zipcode: "84101", phone: "+18015550130", currency: "USD", language: "es", timezone: "America/Denver", description: "", status: "active", createdAt: "2026-04-22T12:00:00.000Z" },
      ],
      closures: [{ id: "cls_001", startDate: "2026-12-24", endDate: "2026-12-26", branchIds: ["ma", "nc", "ri", "ut"], description: "Navidad" }],
      taxGroups: [{ id: "tax_001", name: "Impuesto a las ventas", taxes: [{ name: "Estatal", percent: 6.25 }] }],
      devices: [],
    },
  };
}
