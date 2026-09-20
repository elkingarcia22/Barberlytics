import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ControlValue, DocControl } from "../registry/types";

export interface KnobsProps {
  controls: Record<string, DocControl>;
  values: Record<string, ControlValue>;
  onChange: (key: string, value: ControlValue) => void;
  className?: string;
}

/** Panel de controles del playground: un campo por prop editable. */
export function Knobs({ controls, values, onChange, className }: KnobsProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Object.entries(controls).map(([key, control]) => {
        const id = `knob-${key}`;
        const label = control.label ?? key;
        if (control.type === "boolean") {
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={id} className="text-xs font-medium text-text-secondary">
                {label}
              </Label>
              <Switch id={id} checked={Boolean(values[key])} onCheckedChange={(checked) => onChange(key, checked)} />
            </div>
          );
        }
        if (control.type === "select") {
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={id} className="text-xs font-medium text-text-secondary">
                {label}
              </Label>
              <Select value={String(values[key])} onValueChange={(value) => onChange(key, value)}>
                <SelectTrigger id={id} className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {control.options.map((option) => (
                    <SelectItem key={option} value={option} className="text-xs">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (control.type === "number") {
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={id} className="text-xs font-medium text-text-secondary">
                {label}
              </Label>
              <Input
                id={id}
                type="number"
                className="h-8 text-xs"
                value={Number(values[key])}
                min={control.min}
                max={control.max}
                step={control.step}
                onChange={(event) => onChange(key, Number(event.target.value))}
              />
            </div>
          );
        }
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-xs font-medium text-text-secondary">
              {label}
            </Label>
            <Input
              id={id}
              className="h-8 text-xs"
              value={String(values[key])}
              placeholder={control.placeholder}
              onChange={(event) => onChange(key, event.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
