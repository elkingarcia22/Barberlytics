import * as React from "react";
import { ArrowLeftRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Company } from "./appShellData";

const numberFormat = new Intl.NumberFormat("es-CO");

const GoogleMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

export const CompanyMark: React.FC<{ company: Company; size?: "sm" | "md" }> = ({ company, size = "md" }) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-[11px] font-extrabold text-white",
      size === "md" ? "h-8 w-8" : "h-6 w-6",
      company.isGoogle && "ring-1 ring-inset ring-border/50"
    )}
    style={{ background: company.bg }}
  >
    {company.isGoogle ? <GoogleMark className={size === "md" ? "h-5 w-5" : "h-4 w-4"} /> : company.initial}
  </span>
);

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

export interface CompanyMenuProps {
  companies: readonly Company[];
  activeCompany: Company;
  onSelectCompany: (id: string) => void;
  links: readonly string[];
  /** Iconos opcionales por enlace, en el mismo orden. */
  linkIcons?: readonly React.ComponentType<{ className?: string }>[];
}

/**
 * La identidad de la empresa: toda la fila es el disparador del menú, no un
 * botón de tres puntos escondido al final. Dentro, el consumo de licencias y
 * créditos se ve como proporción, y cambiar de empresa abre su propio menú al
 * lado en vez de sustituir a este, que obligaba a volver para seguir.
 */
export function CompanyMenu({ companies, activeCompany, onSelectCompany, links, linkIcons }: CompanyMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Empresa: ${activeCompany.name}. Abrir menú`}
          data-testid="company-trigger"
          className={cn(
            "mb-4 flex h-11 w-full items-center gap-2 rounded-xl px-1.5 text-left transition-colors",
            "hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            open && "bg-background"
          )}
        >
          <CompanyMark company={activeCompany} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-text-primary">
            {activeCompany.name}
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={8} className="w-[264px]">
        <div className="flex items-center gap-2.5 px-1.5 pb-2 pt-1">
          <CompanyMark company={activeCompany} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-text-primary">{activeCompany.name}</span>
            <span className="block truncate text-[11px] tabular-nums text-text-muted">
              {numberFormat.format(activeCompany.licenses[0])} personas
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5 px-0.5 pb-1">
          <UsageCard label="Licencias" value={activeCompany.licenses[0]} total={activeCompany.licenses[1]} tone="brand" />
          <UsageCard label="Créditos de IA" value={activeCompany.credits[0]} total={activeCompany.credits[1]} tone="ai" />
        </div>

        <DropdownMenuSeparator />

        {links.map((label, index) => {
          const Icon = linkIcons?.[index];
          return (
            <DropdownMenuItem key={label} onSelect={() => setOpen(false)}>
              {Icon && <Icon className="size-4 shrink-0 text-text-muted" />}
              {label}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Cambiar de empresa es su propio menú, no una vista que sustituye
            a esta: así no se pierde de vista dónde se estaba. */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="company-switch">
            <ArrowLeftRight className="size-4 shrink-0 text-text-muted" />
            Cambiar de empresa
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-[272px]">
            <DropdownMenuLabel className="flex items-center justify-between gap-2">
              Tus empresas
              <span className="text-[11px] font-semibold tabular-nums text-text-muted">{companies.length}</span>
            </DropdownMenuLabel>
            {companies.map((company) => {
              const isActive = company.id === activeCompany.id;
              return (
                <DropdownMenuItem
                  key={company.id}
                  onSelect={() => {
                    onSelectCompany(company.id);
                    setOpen(false);
                  }}
                  className={cn("gap-2.5 py-2", isActive && "bg-primary/[0.07]")}
                >
                  <CompanyMark company={company} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px]", isActive ? "font-semibold text-text-primary" : "font-medium")}>
                      {company.name}
                    </span>
                    <span className="block truncate text-[11px] tabular-nums text-text-muted">
                      {company.plan ? `${company.plan} · ` : ""}
                      {numberFormat.format(company.licenses[0])} personas
                    </span>
                  </span>
                  {isActive && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
