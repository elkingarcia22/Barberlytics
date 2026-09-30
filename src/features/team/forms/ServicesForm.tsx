import * as React from "react";
import { Scissors, SlidersHorizontal } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { Field, NumberField } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { ListItem, ListItemGroup } from "@/components/data-display/ListItem";
import { IconTile } from "@/components/utility";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/typography";
import type { Service } from "@/features/calendar/types";
import { InfoCard } from "../teamShared";
import { overrideFor } from "../teamUtils";
import type { ServiceOverride } from "../types";

/**
 * La pestaña Servicios: qué hace esta persona y, por servicio, sus valores
 * propios (precio, precio para cliente nuevo, de lealtad, tiempo, comisión
 * dividida y extra). Vacío significa que usa el catálogo.
 */

export interface ServicesFormProps {
  services: readonly Service[];
  value: ServiceOverride[];
  onChange: (value: ServiceOverride[]) => void;
  formatMoney: (value: number) => string;
}

const EMPTY_OVERRIDE = (serviceId: string, offered: boolean): ServiceOverride => ({ serviceId, offered, price: null, newClientPrice: null, loyaltyPrice: null, durationMin: null, splitCommission: null, extraCommission: null });

const OVERRIDE_FIELDS = ["price", "newClientPrice", "loyaltyPrice", "durationMin", "splitCommission", "extraCommission"] as const;
type OverrideField = (typeof OVERRIDE_FIELDS)[number];

const isCustom = (override: ServiceOverride | undefined): boolean => Boolean(override && OVERRIDE_FIELDS.some((field) => override[field] !== null));


export function ServicesForm({ services, value, onChange, formatMoney }: ServicesFormProps) {
  const t = useAppT();
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [draft, setDraft] = React.useState<ServiceOverride | null>(null);

  const upsert = (next: ServiceOverride) => onChange([...value.filter((item) => item.serviceId !== next.serviceId), next]);
  const offeredCount = services.filter((service) => overrideFor(value, service.id).offered).length;

  const openAdjust = (service: Service) => {
    setEditing(service);
    setDraft({ ...overrideFor(value, service.id) });
  };

  return (
    <div className="space-y-3" data-testid="services-form">
      <div className="flex items-center justify-between">
        <Text variant="muted">{t("teamMember.services.hint")}</Text>
        <Badge variant="neutral">{t("teamMember.services.offered", { count: offeredCount, total: services.length })}</Badge>
      </div>
      <ListItemGroup>
        {services.map((service) => {
          const override = overrideFor(value, service.id);
          const custom = isCustom(override);
          return (
            <ListItem
              key={service.id}
              leading={<Checkbox aria-label={service.name} checked={override.offered} onCheckedChange={(checked) => upsert({ ...override, offered: checked === true })} />}
              title={service.name}
              description={`${service.category} · ${override.durationMin ?? service.durationMin} min · ${formatMoney(override.price ?? service.price)}`}
              meta={<Badge variant={custom ? "default" : "neutral"}>{custom ? t("teamMember.services.custom") : t("teamMember.services.usesCatalog")}</Badge>}
              actions={
                <Button size="icon-sm" variant="ghost" aria-label={`${t("teamMember.services.adjust")}: ${service.name}`} disabled={!override.offered} onClick={() => openAdjust(service)}>
                  <SlidersHorizontal />
                </Button>
              }
            />
          );
        })}
      </ListItemGroup>

      <ModalShell
        open={Boolean(editing && draft)}
        onOpenChange={(open) => !open && setEditing(null)}
        size="lg"
        title={editing ? t("teamMember.services.adjustTitle", { service: editing.name }) : ""}
        description={t("teamMember.services.adjustHint")}
        actions={
          <>
            <Button variant="ghost" onClick={() => editing && setDraft(EMPTY_OVERRIDE(editing.id, true))}>
              {t("teamMember.services.reset")}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (draft) upsert(draft);
                setEditing(null);
              }}
            >
              {t("teamMember.services.apply")}
            </Button>
          </>
        }
      >
        {editing && draft && (
          <div className="grid gap-4 sm:grid-cols-2">
            <OverrideNumber label={t("teamMember.services.price")} catalog={formatMoney(editing.price)} value={draft.price} onChange={(price) => setDraft({ ...draft, price })} prefix="$" />
            <OverrideNumber label={t("teamMember.services.newClientPrice")} catalog={formatMoney(editing.price)} value={draft.newClientPrice} onChange={(newClientPrice) => setDraft({ ...draft, newClientPrice })} prefix="$" />
            <OverrideNumber label={t("teamMember.services.loyaltyPrice")} catalog={formatMoney(editing.price)} value={draft.loyaltyPrice} onChange={(loyaltyPrice) => setDraft({ ...draft, loyaltyPrice })} prefix="$" />
            <OverrideNumber label={t("teamMember.services.duration")} catalog={`${editing.durationMin} min`} value={draft.durationMin} onChange={(durationMin) => setDraft({ ...draft, durationMin })} suffix="min" step={5} />
            <OverrideNumber label={t("teamMember.services.splitCommission")} catalog="—" value={draft.splitCommission} onChange={(splitCommission) => setDraft({ ...draft, splitCommission })} suffix="%" max={100} />
            <OverrideNumber label={t("teamMember.services.extraCommission")} catalog="—" value={draft.extraCommission} onChange={(extraCommission) => setDraft({ ...draft, extraCommission })} suffix="%" max={100} />
          </div>
        )}
      </ModalShell>
    </div>
  );
}

function OverrideNumber({ label, catalog, value, onChange, prefix, suffix, step = 1, max }: { label: string; catalog: string; value: number | null; onChange: (value: number | null) => void; prefix?: string; suffix?: string; step?: number; max?: number }) {
  const t = useAppT();
  return (
    <Field label={label} description={t("teamMember.services.catalogValue", { value: catalog })}>
      <NumberField value={value} onValueChange={onChange} min={0} max={max} step={step} prefix={prefix} suffix={suffix} size="sm" />
    </Field>
  );
}

/* ------------------------------------------------------------------ view */

export function ServicesView({ services, value, formatMoney }: { services: readonly Service[]; value: readonly ServiceOverride[]; formatMoney: (value: number) => string }) {
  const t = useAppT();
  const offered = services.filter((service) => overrideFor(value, service.id).offered);
  const cell = (field: OverrideField, override: ServiceOverride, money = true) => {
    const raw = override[field];
    if (raw === null) return <span className="text-text-muted">--</span>;
    return money ? formatMoney(raw) : field === "durationMin" ? `${raw} min` : `${raw}%`;
  };
  return (
    <InfoCard title={t("teamMember.services.title")} description={t("teamMember.services.hint")} actions={<Badge variant="neutral">{t("teamMember.services.offered", { count: offered.length, total: services.length })}</Badge>}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("teamMember.tab.services")}</TableHead>
              <TableHead className="text-right">{t("teamMember.services.price")}</TableHead>
              <TableHead className="text-right">{t("teamMember.services.newClientPrice")}</TableHead>
              <TableHead className="text-right">{t("teamMember.services.loyaltyPrice")}</TableHead>
              <TableHead className="text-right">{t("teamMember.services.duration")}</TableHead>
              <TableHead className="text-right">{t("teamMember.services.splitCommission")}</TableHead>
              <TableHead className="text-right">{t("teamMember.services.extraCommission")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offered.map((service) => {
              const override = overrideFor(value, service.id);
              return (
                <TableRow key={service.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <IconTile icon={<Scissors />} size="sm" tone={isCustom(override) ? "primary" : "neutral"} />
                      <span className="flex flex-col">
                        <span className="font-medium text-text-primary">{service.name}</span>
                        <span className="text-xs text-text-muted">{service.category}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{cell("price", override)}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell("newClientPrice", override)}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell("loyaltyPrice", override)}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell("durationMin", override, false)}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell("splitCommission", override, false)}</TableCell>
                  <TableCell className="text-right tabular-nums">{cell("extraCommission", override, false)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </InfoCard>
  );
}
