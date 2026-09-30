import { api } from "@/lib/api";
import {
  metricsBarbersSchema,
  metricsBusinessSchema,
  metricsCustomersSchema,
  metricsInsightsSchema,
  metricsMarketingSchema,
  type MetricsBarbers,
  type MetricsBusiness,
  type MetricsCustomers,
  type MetricsInsights,
  type MetricsMarketing,
  type MetricsParams,
} from "./types";

export const metricsApi = {
  business: (params: MetricsParams, signal?: AbortSignal) =>
    api.get<MetricsBusiness>("/metrics/business", { query: { ...params }, schema: metricsBusinessSchema, signal }),
  customers: (params: MetricsParams, signal?: AbortSignal) =>
    api.get<MetricsCustomers>("/metrics/customers", { query: { ...params }, schema: metricsCustomersSchema, signal }),
  barbers: (params: MetricsParams, signal?: AbortSignal) =>
    api.get<MetricsBarbers>("/metrics/barbers", { query: { ...params }, schema: metricsBarbersSchema, signal }),
  marketing: (params: MetricsParams, signal?: AbortSignal) =>
    api.get<MetricsMarketing>("/metrics/marketing", { query: { ...params }, schema: metricsMarketingSchema, signal }),
  /** El diagnóstico mira los últimos tres meses: no lleva periodo. */
  insights: (signal?: AbortSignal) => api.get<MetricsInsights>("/metrics/insights", { schema: metricsInsightsSchema, signal }),
};
