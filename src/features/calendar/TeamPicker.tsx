import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useAppT } from "@/app/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemaIcon } from "@/icons/ThemaIcon";
import { PersonAvatar } from "./calendarShared";
import { teamIds } from "./calendarModel";
import type { Barber, TeamFilter } from "./types";

/**
 * A quién se ve en la agenda: los que trabajan ese día, todo el equipo, o los
 * barberos que se marquen —uno o varios—. Marcar el primero deja solo a ese;
 * desmarcar el último vuelve a «Trabajando».
 */

export interface TeamPickerProps {
  team: TeamFilter;
  barbers: readonly Barber[];
  onTeamChange: (team: TeamFilter) => void;
}

export function TeamPicker({ team, barbers, onTeamChange }: TeamPickerProps) {
  const t = useAppT();
  const ids = teamIds(team);
  const picked = barbers.filter((barber) => ids.includes(barber.id));
  const label = team === "all" ? t("calendar.team.all") : picked.length === 0 ? t("calendar.team.working") : picked.length === 1 ? picked[0].name : t("calendar.team.count", { count: picked.length });

  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    // Se guardan en el orden del calendario, no en el que se fueron marcando.
    onTeamChange(next.length === 0 ? "working" : barbers.filter((barber) => next.includes(barber.id)).map((barber) => barber.id).join(","));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between" aria-label={t("calendar.team")} data-testid="calendar-team">
          <span className="flex min-w-0 items-center gap-2">
            <ThemaIcon name="users" size="sm" decorative />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="text-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2" data-testid="calendar-team-panel">
        <ul>
          <PresetRow label={t("calendar.team.working")} selected={team === "working"} onSelect={() => onTeamChange("working")} />
          <PresetRow label={t("calendar.team.all")} selected={team === "all"} onSelect={() => onTeamChange("all")} />
        </ul>
        <div className="my-1 border-t border-border/60" role="separator" />
        <ul className="max-h-72 overflow-y-auto overscroll-contain" aria-label={t("calendar.team.pick")}>
          {barbers.map((barber) => (
            <BarberRow key={barber.id} barber={barber} checked={ids.includes(barber.id)} onToggle={() => toggle(barber.id)} />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const ROW = "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text-primary transition-colors duration-fast hover:bg-surface-subtle motion-reduce:transition-none";

function PresetRow({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button type="button" aria-pressed={selected} onClick={onSelect} className={cn(ROW, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50")}>
        <span className="flex-1">{label}</span>
        {selected && <Check className="size-4 text-primary" aria-hidden="true" />}
      </button>
    </li>
  );
}

function BarberRow({ barber, checked, onToggle }: { barber: Barber; checked: boolean; onToggle: () => void }) {
  const id = React.useId();
  return (
    <li data-testid={`calendar-team-${barber.id}`}>
      <label htmlFor={id} className={ROW}>
        <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
        <PersonAvatar name={barber.name} avatarUrl={barber.avatarUrl} size="sm" />
        <span className="min-w-0 flex-1 truncate">{barber.name}</span>
      </label>
    </li>
  );
}
