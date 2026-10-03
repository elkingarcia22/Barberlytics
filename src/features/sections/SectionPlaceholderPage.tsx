import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import type { AppMessageKey } from "@/app/i18n";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback";
import type { IconName } from "@/icons";
import { PageHeader } from "@/components/utility";

export interface SectionPlaceholderPageProps {
  /** El nombre de la sección, con la misma clave que usa el menú. */
  titleKey: AppMessageKey;
  /** Qué vivirá aquí: lo que se promete, no un "próximamente" vacío. */
  descriptionKey: AppMessageKey;
  /** Concepto del registro de iconos; es la ilustración del estado. */
  icon: IconName;
  /** Migas de más de un nivel (p. ej. Servicios & Productos › Servicios). */
  trail?: readonly AppMessageKey[];
}

/**
 * Una sección del menú que todavía no tiene pantalla.
 *
 * No es una página de error ni un 404: la sección existe, está en el menú y
 * llegará. Lo que hace falta es que quien entre sepa qué va a encontrar aquí
 * y que el marco (migas, título, estado) sea ya el definitivo, para que
 * construir la pantalla sea rellenar el cuerpo y nada más.
 */
export function SectionPlaceholderPage({ titleKey, descriptionKey, icon, trail = [] }: SectionPlaceholderPageProps) {
  const t = useAppT();
  const navigate = useNavigate();

  return (
    <>
      <ShellHeaderSlot>
        <Breadcrumbs
          items={[{ label: t("nav.home"), onClick: () => navigate("/metricas") }, ...trail.map((key) => t(key)), t(titleKey)]}
        />
      </ShellHeaderSlot>

      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {t(titleKey)}
            <Badge variant="neutral">{t("soon.badge")}</Badge>
          </span>
        }
        description={t(descriptionKey)}
      />

      <EmptyState icon={icon} title={t("soon.title")} description={t("soon.hint")} />
    </>
  );
}
