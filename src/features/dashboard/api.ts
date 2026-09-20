import { api } from "@/lib/api";
import { dashboardSummarySchema, type DashboardSummary } from "./types";

export const dashboardApi = {
  summary: (signal?: AbortSignal) => api.get<DashboardSummary>("/dashboard/summary", { schema: dashboardSummarySchema, signal }),
};
