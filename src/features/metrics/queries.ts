import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { metricsApi } from "./api";
import type { MetricsParams } from "./types";

export const metricsKeys = {
  all: ["metrics"] as const,
  business: (params: MetricsParams) => [...metricsKeys.all, "business", params] as const,
  customers: (params: MetricsParams) => [...metricsKeys.all, "customers", params] as const,
  barbers: (params: MetricsParams) => [...metricsKeys.all, "barbers", params] as const,
  marketing: (params: MetricsParams) => [...metricsKeys.all, "marketing", params] as const,
  insights: (branchId: string) => [...metricsKeys.all, "insights", branchId] as const,
};

/*
 * Al cambiar de periodo se deja el dato anterior en pantalla hasta que llega
 * el nuevo: un tablero que parpadea a esqueletos con cada flecha se lee peor
 * que uno que se actualiza en el sitio.
 */
export function useBusinessMetrics(params: MetricsParams) {
  return useQuery({
    queryKey: metricsKeys.business(params),
    queryFn: ({ signal }) => metricsApi.business(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCustomersMetrics(params: MetricsParams) {
  return useQuery({
    queryKey: metricsKeys.customers(params),
    queryFn: ({ signal }) => metricsApi.customers(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useBarbersMetrics(params: MetricsParams) {
  return useQuery({
    queryKey: metricsKeys.barbers(params),
    queryFn: ({ signal }) => metricsApi.barbers(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useMarketingMetrics(params: MetricsParams) {
  return useQuery({
    queryKey: metricsKeys.marketing(params),
    queryFn: ({ signal }) => metricsApi.marketing(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useInsightsMetrics(branchId: string) {
  return useQuery({ queryKey: metricsKeys.insights(branchId), queryFn: ({ signal }) => metricsApi.insights(branchId, signal) });
}
