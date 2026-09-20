import { z } from "zod";

export const dashboardSummarySchema = z.object({
  kpis: z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    invitedUsers: z.number(),
    activationRate: z.number(),
  }),
  byArea: z.array(z.object({ area: z.string(), count: z.number() })),
  signups: z.array(z.object({ month: z.string(), count: z.number() })),
});
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
