import * as React from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { ListItem, ListItemGroup } from "@/components/data-display";
import { IconTile, PageHeader, SectionHeader } from "@/components/utility";
import { ROLE_HOME, useAccess } from "@/features/access";
import { buildSettingsGroups } from "./settingsCatalog";
import { SETTINGS_GROUP_TONES, SETTINGS_ICONS } from "./settingsIcons";

/**
 * Todo lo que se ajusta, en una sola pantalla.
 *
 * El menú de la cabecera sirve para ir directo a un ajuste que ya se conoce;
 * esta pantalla es para lo otro: buscar algo que se ajusta cada seis meses y
 * que nadie recuerda en qué grupo estaba. Por eso aquí cada ajuste sí trae su
 * línea de qué hace. Solo enseña lo que el rol de quien mira puede abrir: a un
 * barbero, sus preferencias y su usuario; nunca una pantalla vacía.
 */
export function SettingsPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const access = useAccess();
  const groups = React.useMemo(() => buildSettingsGroups(t, access), [t, access]);

  return (
    <>
      <ShellHeaderSlot>
        <Breadcrumbs items={[{ label: t("nav.home"), onClick: () => navigate(ROLE_HOME[access.role]) }, t("settings.title")]} />
      </ShellHeaderSlot>

      <PageHeader title={t("settings.title")} description={t("settings.description")} />

      {/* Dos columnas en pantalla ancha, alineadas arriba: los grupos no miden
          lo mismo y estirarlos a la misma altura dejaría huecos muertos. */}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`settings-${group.id}`} className="space-y-3">
            <SectionHeader id={`settings-${group.id}`} title={group.label} />
            <ListItemGroup>
              {group.items.map((item) => {
                const Icon = SETTINGS_ICONS[item.id];
                return (
                  <ListItem
                    key={item.id}
                    leading={
                      Icon ? (
                        <IconTile
                          icon={<Icon />}
                          tone={item.tone === "danger" ? "negative" : SETTINGS_GROUP_TONES[group.id] ?? "primary"}
                        />
                      ) : undefined
                    }
                    title={item.label}
                    description={item.description}
                    meta={<ChevronRight className="size-4" strokeWidth={2} />}
                    onClick={() => item.path && navigate(item.path)}
                  />
                );
              })}
            </ListItemGroup>
          </section>
        ))}
      </div>
    </>
  );
}
