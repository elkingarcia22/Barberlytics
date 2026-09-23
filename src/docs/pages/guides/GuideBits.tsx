import type * as React from "react";
import { Check, X, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Piezas de composición de las guías: reglas numeradas, tarjetas de
 * decisión y listas de sí/no. Son tipografía y superficies del sistema,
 * nada nuevo que documentar.
 */

export function RuleCard({ icon: Icon, title, children, href, linkLabel }: { icon: LucideIcon; title: string; children: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <Card className="flex h-full flex-col gap-3 p-card">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-[13px] leading-relaxed text-text-secondary">{children}</p>
      </div>
      {href && (
        <a href={href} className="mt-auto text-[13px] font-medium text-primary hover:underline">
          {linkLabel ?? "Ver más"} →
        </a>
      )}
    </Card>
  );
}

export function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">{number}</span>
      <div className="min-w-0 flex-1 space-y-2 pb-6">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="space-y-2 text-[13px] leading-relaxed text-text-secondary">{children}</div>
      </div>
    </li>
  );
}

export function DoDont({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="p-card">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-success">Sí</p>
        <ul className="space-y-2">
          {dos.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-card">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive">No</p>
        <ul className="space-y-2">
          {donts.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
              <X className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function Demo({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {hint && <p className="text-[12px] text-text-secondary">{hint}</p>}
      </div>
      <div className={cn("rounded-2xl border border-border/60 bg-background p-card", className)}>{children}</div>
    </div>
  );
}

export function Decision({ rows }: { rows: { when: string; use: string; href?: string }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface">
      <table className="w-full text-[13px]">
        <thead className="bg-surface-subtle text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          <tr>
            <th className="px-4 py-2.5">Cuando…</th>
            <th className="px-4 py-2.5">Usa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => (
            <tr key={row.when}>
              <td className="px-4 py-3 text-text-secondary">{row.when}</td>
              <td className="px-4 py-3 font-medium text-text-primary">
                {row.href ? (
                  <a href={row.href} className="text-primary hover:underline">
                    {row.use}
                  </a>
                ) : (
                  row.use
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
