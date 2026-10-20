import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import type { AppMessageKey } from "@/app/i18n";

/**
 * Los avisos de la campana: salen de lo que pasó en la sucursal (docs/API_CONTRACT.md, «Avisos») y
 * cada rol ve los suyos. Se piden cada minuto mientras hay sesión.
 */

const kindSchema = z.enum(["onlineBooking", "cancelled", "noShow", "whatsappFailed", "whatsappReply", "clientArrived", "lowStock", "outOfStock", "registerDifference", "registerOpen", "payrollDue", "payrollPaid", "lowReview", "absenceRequested", "absenceDecided", "waitlistJoined"]);
export type NotificationKind = z.infer<typeof kindSchema>;

const notificationSchema = z.object({
  id: z.string(),
  kind: kindSchema,
  at: z.string(),
  href: z.string(),
  tone: z.enum(["info", "warning", "negative", "positive"]),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
  read: z.boolean(),
});
export type AppNotification = z.infer<typeof notificationSchema>;
const listSchema = z.object({ items: z.array(notificationSchema), unread: z.number() });

export const NOTIFICATION_KEYS: Readonly<Record<NotificationKind, { title: AppMessageKey; body: AppMessageKey }>> = {
  onlineBooking: { title: "notifications.onlineBooking.title", body: "notifications.onlineBooking.body" },
  cancelled: { title: "notifications.cancelled.title", body: "notifications.cancelled.body" },
  noShow: { title: "notifications.noShow.title", body: "notifications.noShow.body" },
  whatsappFailed: { title: "notifications.whatsappFailed.title", body: "notifications.whatsappFailed.body" },
  whatsappReply: { title: "notifications.whatsappReply.title", body: "notifications.whatsappReply.body" },
  clientArrived: { title: "notifications.clientArrived.title", body: "notifications.clientArrived.body" },
  lowStock: { title: "notifications.lowStock.title", body: "notifications.lowStock.body" },
  outOfStock: { title: "notifications.outOfStock.title", body: "notifications.outOfStock.body" },
  registerDifference: { title: "notifications.registerDifference.title", body: "notifications.registerDifference.body" },
  registerOpen: { title: "notifications.registerOpen.title", body: "notifications.registerOpen.body" },
  payrollDue: { title: "notifications.payrollDue.title", body: "notifications.payrollDue.body" },
  payrollPaid: { title: "notifications.payrollPaid.title", body: "notifications.payrollPaid.body" },
  lowReview: { title: "notifications.lowReview.title", body: "notifications.lowReview.body" },
  absenceRequested: { title: "notifications.absenceRequested.title", body: "notifications.absenceRequested.body" },
  absenceDecided: { title: "notifications.absenceDecided.title", body: "notifications.absenceDecided.body" },
  waitlistJoined: { title: "notifications.waitlistJoined.title", body: "notifications.waitlistJoined.body" },
};

const POLL_MS = 60_000;

export function useNotifications(query: { branchId: string; role: string; memberId: string | null; enabled: boolean }) {
  return useQuery({
    queryKey: ["notifications", query.branchId, query.role, query.memberId],
    queryFn: ({ signal }) => api.get("/notifications", { query: { branchId: query.branchId, role: query.role, memberId: query.memberId }, schema: listSchema, signal }),
    enabled: query.enabled,
    refetchInterval: POLL_MS,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: readonly string[]) => api.post<void>("/notifications/read", { ids }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const WHEN_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };

export interface ShellNotificationDeps {
  t: (key: AppMessageKey, params?: Readonly<Record<string, string | number>>) => string;
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  navigate: (href: string) => void;
  markRead: (ids: readonly string[]) => void;
}

/** «2026-10-18» → «18 oct»; las cifras de dinero con la moneda de la sucursal. */
function formatParams(params: AppNotification["params"], deps: ShellNotificationDeps): Record<string, string | number> {
  const out: Record<string, string | number> = { ...params };
  for (const key of ["day", "from", "to"] as const) if (typeof params[key] === "string") out[key] = deps.formatDate(new Date(`${params[key]}T12:00:00`), DAY_FORMAT);
  if (typeof params.amount === "number") out.amount = deps.formatMoney(Math.abs(params.amount));
  if (params.status === "approved" || params.status === "rejected") out.status = deps.t(params.status === "approved" ? "notifications.absenceApproved" : "notifications.absenceRejected");
  if (typeof params.amount === "number") out.direction = deps.t(params.amount < 0 ? "notifications.missing" : "notifications.over");
  return out;
}

/** Los avisos como los pinta la campana: el texto en el idioma de quien lee y, al tocarlo, leído y abierto. */
export function toShellNotifications(items: readonly AppNotification[], deps: ShellNotificationDeps) {
  return items.map((item) => {
    const params = formatParams(item.params, deps);
    const keys = NOTIFICATION_KEYS[item.kind];
    return {
      id: item.id,
      title: deps.t(keys.title, params),
      description: deps.t(keys.body, params),
      date: deps.formatDate(new Date(item.at), WHEN_FORMAT),
      unread: !item.read,
      tone: item.tone,
      onSelect: () => {
        if (!item.read) deps.markRead([item.id]);
        deps.navigate(item.href);
      },
    };
  });
}
