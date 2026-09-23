import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError } from "@/lib/api";
import { brandingApi } from "./api";
import type { BrandingInput } from "./types";

export const brandingKeys = {
  all: ["branding"] as const,
};

/** El logo cambia muy de vez en cuando: se cachea largo y no se reintenta en bucle. */
const BRANDING_STALE_MS = 5 * 60 * 1000;

export function useBrandingQuery() {
  return useQuery({
    queryKey: brandingKeys.all,
    queryFn: ({ signal }) => brandingApi.get(signal),
    staleTime: BRANDING_STALE_MS,
  });
}

export function useSaveBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BrandingInput) => brandingApi.save(input),
    onSuccess: (branding) => {
      queryClient.setQueryData(brandingKeys.all, branding);
      toast.success(branding.logo ? "Logo guardado" : "Se restableció la marca Barberlytics", {
        description: branding.logo ? "Ya se ve en el menú de toda la empresa." : "El menú vuelve a mostrar el logo de Barberlytics.",
      });
    },
    onError: (error) => {
      const { title, description } = describeError(error);
      toast.error(title, { description });
    },
  });
}
