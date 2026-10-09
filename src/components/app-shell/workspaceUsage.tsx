import type { Company } from "./appShellData";

const numberFormat = new Intl.NumberFormat("es-CO");

/**
 * Anillo de consumo: un dato de "cuánto llevas de lo que tienes" se lee de un
 * vistazo como proporción, no como dos números separados por una barra. El
 * arco se dibuja con `stroke-dasharray` sobre una circunferencia normalizada,
 * así el porcentaje no depende del radio.
 */
function UsageRing({ value, total, tone }: { value: number; total: number; tone: "brand" | "ai" }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center">
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-border/60" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          className={tone === "brand" ? "stroke-primary" : "stroke-[hsl(var(--ai-gradient-end))]"}
        />
      </svg>
      <span className="absolute text-[9px] font-bold tabular-nums text-text-primary">{pct}%</span>
    </span>
  );
}

function UsageCard({ label, value, total, tone }: { label: string; value: number; total: number; tone: "brand" | "ai" }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface px-2.5 py-2">
      <UsageRing value={value} total={total} tone={tone} />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-text-primary">{label}</span>
        <span className="block truncate text-[11px] tabular-nums text-text-muted">
          {numberFormat.format(value)} de {numberFormat.format(total)}
        </span>
      </span>
    </div>
  );
}

/**
 * El consumo del espacio activo —licencias y créditos de IA— dentro de su
 * menú. Sin esos datos, o con el consumo apagado, no pinta nada: un producto
 * que no vende licencias deja el menú en identidad y cambio.
 */
export function WorkspaceUsage({ company, enabled = true }: { company: Company; enabled?: boolean }) {
  if (!enabled || !company.licenses || !company.credits) return null;
  return (
    <div className="flex flex-col gap-1.5 px-0.5 pb-1">
      <UsageCard label="Licencias" value={company.licenses[0]} total={company.licenses[1]} tone="brand" />
      <UsageCard label="Créditos de Clipper" value={company.credits[0]} total={company.credits[1]} tone="ai" />
    </div>
  );
}

/** La línea que describe un espacio: su propia frase o, si no la trae, su tamaño. */
export function companyMeta(company: Company): string | undefined {
  if (company.meta) return company.meta;
  return company.licenses ? `${numberFormat.format(company.licenses[0])} personas` : undefined;
}
