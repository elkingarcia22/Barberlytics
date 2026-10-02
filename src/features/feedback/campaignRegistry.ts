/**
 * Las campañas de feedback, como datos planos: sin React, sin alias `@/` y sin
 * nada del navegador, porque las lee tanto la app como la función de servidor
 * (`api/feedback`). El servidor solo acepta comentarios de la campaña activa:
 * así un tercero no puede llenar la cuenta de hojas inventando ids.
 *
 * Activar la escucha = apuntar `ACTIVE_CAMPAIGN_DEFINITION` a una campaña y
 * desplegar. La hoja de esa campaña se crea sola la primera vez que hace falta
 * (primer comentario, activación explícita o el cron semanal); cerrar la
 * escucha es dejarlo en `null`.
 */
export interface CampaignSection {
  value: string;
  label: string;
}

export interface CampaignDefinition {
  /** Estable y único: identifica la hoja de la campaña y lo que recuerda el navegador. */
  id: string;
  /** Lo que se lanzó, tal como se lee en la hoja y en el resumen. */
  name: string;
  sections: readonly CampaignSection[];
}

export const REDESIGN_DEFINITION: CampaignDefinition = {
  id: "rediseno-barberlytics-2026-09",
  name: "Rediseño de Barberlytics",
  sections: [
    { value: "general", label: "Impresión general" },
    { value: "navegacion", label: "Menú y navegación" },
    { value: "metricas", label: "Métricas" },
    { value: "agenda", label: "Calendario y agenda" },
    { value: "equipo", label: "Equipo y roles" },
    { value: "configuracion", label: "Configuración" },
    { value: "falta", label: "Algo que falta" },
  ],
};

/** La campaña que está escuchando ahora. `null` = sin botón, sin recorrido y sin hoja. */
export const ACTIVE_CAMPAIGN_DEFINITION: CampaignDefinition | null = REDESIGN_DEFINITION;
