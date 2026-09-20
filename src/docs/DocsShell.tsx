import * as React from "react";
import { Home, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemaLogo } from "@/components/ui/ThemaLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeModeToggle, ThemeSelector } from "@/themes";
import { ALL_ENTRIES, DOC_GROUPS, entriesByGroup } from "./registry";
import { routeToHash, useHashRoute, type DocsRoute } from "./router";
import { FOUNDATION_PAGES } from "./foundationPages";



function isActive(route: DocsRoute, target: DocsRoute): boolean {
  if (route.kind !== target.kind) return false;
  if (route.kind === "home") return true;
  return "id" in route && "id" in target && route.id === target.id;
}

function NavLink({
  route,
  target,
  children,
  onNavigate,
  className,
}: {
  route: DocsRoute;
  target: DocsRoute;
  children: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = isActive(route, target);
  return (
    <a
      href={routeToHash(target)}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-text-secondary hover:bg-accent/60 hover:text-text-primary",
        className
      )}
    >
      {children}
    </a>
  );
}

function SidebarNav({ route, onNavigate }: { route: DocsRoute; onNavigate?: () => void }) {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? ALL_ENTRIES.filter(
        (entry) =>
          entry.name.toLowerCase().includes(normalized) ||
          entry.description.toLowerCase().includes(normalized) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(normalized))
      )
    : null;

  return (
    <div className="flex h-full flex-col">
      <a href="#/" onClick={onNavigate} className="flex items-center gap-3 px-3 pb-5 pt-1">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-card">
          <ThemaLogo size={18} />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-text-primary">Thema</span>
          <span className="block text-[11px] text-text-muted">Sistema de diseño · v0.1</span>
        </span>
      </a>

      <label className="relative mb-4 block px-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar componente…"
          className="h-9 w-full rounded-lg border border-border/60 bg-surface pl-9 pr-8 text-[13px] text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="size-3.5" />
          </button>
        )}
      </label>

      <nav aria-label="Documentación" className="flex-1 space-y-6 overflow-y-auto px-1 pb-8">
        {results ? (
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              {results.length} resultado{results.length === 1 ? "" : "s"}
            </p>
            {results.map((entry) => (
              <NavLink key={entry.id} route={route} target={{ kind: "component", id: entry.id }} onNavigate={onNavigate}>
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-text-muted">{entry.group}</span>
              </NavLink>
            ))}
            {results.length === 0 && <p className="px-2.5 text-[13px] text-text-muted">Nada por aquí.</p>}
          </div>
        ) : (
          <>
            <div className="space-y-0.5">
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Fundamentos</p>
              <NavLink route={route} target={{ kind: "home" }} onNavigate={onNavigate}>
                <Home className="size-4" />
                Inicio
              </NavLink>
              {FOUNDATION_PAGES.map((page) => (
                <NavLink key={page.id} route={route} target={{ kind: "foundation", id: page.id }} onNavigate={onNavigate}>
                  <page.icon className="size-4" />
                  {page.label}
                </NavLink>
              ))}
            </div>
            {DOC_GROUPS.map((group) => {
              const entries = entriesByGroup(group.id);
              if (entries.length === 0) return null;
              return (
                <div key={group.id} className="space-y-0.5">
                  <a
                    href={routeToHash({ kind: "group", id: group.id })}
                    onClick={onNavigate}
                    className="flex items-center justify-between px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted hover:text-text-primary"
                  >
                    {group.label}
                    <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium normal-case tracking-normal text-text-muted">
                      {entries.length}
                    </span>
                  </a>
                  {entries.map((entry) => (
                    <NavLink key={entry.id} route={route} target={{ kind: "component", id: entry.id }} onNavigate={onNavigate}>
                      <span className="truncate">{entry.name}</span>
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}

function breadcrumb(route: DocsRoute): string[] {
  switch (route.kind) {
    case "home":
      return ["Inicio"];
    case "foundation":
      return ["Fundamentos", FOUNDATION_PAGES.find((page) => page.id === route.id)?.label ?? route.id];
    case "group":
      return ["Componentes", DOC_GROUPS.find((group) => group.id === route.id)?.label ?? route.id];
    case "component": {
      const entry = ALL_ENTRIES.find((item) => item.id === route.id);
      const group = DOC_GROUPS.find((item) => item.id === entry?.group);
      return ["Componentes", group?.label ?? "", entry?.name ?? route.id].filter(Boolean);
    }
  }
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const { route } = useHashRoute();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const crumbs = breadcrumb(route);

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[272px] border-r border-border/60 bg-background px-3 py-4 lg:block">
        <SidebarNav route={route} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] px-3 py-4 sm:max-w-[300px]">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarNav route={route} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir navegación">
            <Menu />
          </Button>
          <ol className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-[13px] text-text-muted">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <li key={`${crumb}-${index}`} className={cn("flex min-w-0 items-center gap-1.5", !isLast && "hidden sm:flex")}>
                  {index > 0 && <span aria-hidden className="hidden sm:inline">/</span>}
                  <span className={cn("truncate", isLast && "font-medium text-text-primary")}>{crumb}</span>
                </li>
              );
            })}
          </ol>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ThemeSelector />
            <ThemeModeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
